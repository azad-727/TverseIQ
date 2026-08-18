package com.tverseIQ.backend.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.tverseIQ.backend.dto.ParsedRowDto;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Platform;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.AdsReportUploadRepository; // Your tracking table
import com.tverseIQ.backend.repository.SearchTermRowJdbcRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReportParserService {

    private final ChannelSkuMapRepository channelSkuMapRepository;
    private final AdsReportUploadRepository uploadRepository;
    private final SearchTermRowJdbcRepository searchTermRowJdbcRepository;

    public ReportParserService(ChannelSkuMapRepository channelSkuMapRepository,
                               AdsReportUploadRepository uploadRepository, SearchTermRowJdbcRepository searchTermRowJdbcRepository) {
        this.channelSkuMapRepository = channelSkuMapRepository;
        this.uploadRepository = uploadRepository;
        this.searchTermRowJdbcRepository = searchTermRowJdbcRepository;
    }

    @Async
    public void parseAndIngestReport(MultipartFile file, Platform platform, Long uploadId) {
        log.info("Job {}: Started async parsing for {} file", uploadId, platform);

        updateJobStatus(uploadId, "PROCESSING");

        Map<String, Long> entityResolutionMap = channelSkuMapRepository.findByPlatform(platform)
                .stream()
                .collect(Collectors.toMap(
                        ChannelSkuMap::getChannelProductId,
                        map -> map.getProduct().getProductId()
                ));

        List<ParsedRowDto> batch = new ArrayList<>();

        try {
            if (platform == Platform.AMAZON) {
                parseAmazonExcel(file, batch, entityResolutionMap);
            } else if (platform == Platform.FLIPKART) {
                parseFlipkartCsv(file, batch, entityResolutionMap);
            }

            if (!batch.isEmpty()) {
                flushToDatabase(batch);
            }

            updateJobStatus(uploadId, "COMPLETED");
            log.info("Job {}: Successfully completed.", uploadId);

        } catch (Exception e) {
            log.error("Job {}: Failed during parsing.", uploadId, e);
            updateJobStatus(uploadId, "FAILED");
        }
    }

    // ==========================================
    // AMAZON PARSER (XLSX)
    // ==========================================
    private void parseAmazonExcel(MultipartFile file, List<ParsedRowDto> batch, Map<String, Long> resolutionMap) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String campaignName = getCellText(row.getCell(4));
                String adGroupName = getCellText(row.getCell(5));
                String keyword = getCellText(row.getCell(9));
                String matchType = getCellText(row.getCell(8));

                BigDecimal spend = getNumericCell(row.getCell(14));
                BigDecimal orders = getNumericCell(row.getCell(18));
                BigDecimal sales = getNumericCell(row.getCell(15));

                // O(1) Memory Lookup instead of Database hit
                Long resolvedProductId = resolutionMap.get(adGroupName);

                if (resolvedProductId != null) {
                    batch.add(new ParsedRowDto(resolvedProductId, campaignName, keyword, matchType, spend, orders, sales));
                    checkAndFlush(batch);
                }
            }
        }
    }

    // ==========================================
    // FLIPKART PARSER (CSV) - FIX 3: OpenCSV
    // ==========================================
    private void parseFlipkartCsv(MultipartFile file, List<ParsedRowDto> batch, Map<String, Long> resolutionMap) throws Exception {
        // OpenCSV automatically handles quoted strings containing commas
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] cols;
            int lineNumber = 0;

            while ((cols = reader.readNext()) != null) {
                lineNumber++;
                // Skip the first 3 lines (2 metadata + 1 header)
                if (lineNumber <= 3) continue;
                if (cols.length < 17) continue;

                String adGroupName = cols[1].trim();
                String campaignName = cols[3].trim();
                String keyword = cols[4].trim();

                BigDecimal orders = new BigDecimal(cols[9]).add(new BigDecimal(cols[10]));
                BigDecimal sales = new BigDecimal(cols[13]).add(new BigDecimal(cols[14]));
                BigDecimal spend = new BigDecimal(cols[16]);
                String matchType = "BROAD";

                // O(1) Memory Lookup
                Long resolvedProductId = resolutionMap.get(campaignName);

                if (resolvedProductId != null) {
                    batch.add(new ParsedRowDto(resolvedProductId, campaignName, keyword, matchType, spend, orders, sales));
                    checkAndFlush(batch);
                }
            }
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    private void updateJobStatus(Long uploadId, String status) {
        uploadRepository.updateStatus(uploadId,status);
    }

    private void checkAndFlush(List<ParsedRowDto> batch) {
        if (batch.size() >= 1000) {
            flushToDatabase(batch);
            batch.clear(); // Free up Java Heap space
        }
    }

    private void flushToDatabase(List<ParsedRowDto> batch) {
        log.info("Flushing batch of {} rows to the database...", batch.size());
    }

    private String getCellText(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }

    private BigDecimal getNumericCell(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) return BigDecimal.ZERO;
        return BigDecimal.valueOf(cell.getNumericCellValue());
    }
    private void flushToDatabase(List<ParsedRowDto> batch, Long uploadId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("Flushing batch of {} rows to the database...", batch.size());

        searchTermRowJdbcRepository.batchUpsert(batch, uploadId, periodStart, periodEnd);
    }

    private Integer getIntegerCell(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) return 0;
        return (int) cell.getNumericCellValue();
    }
}