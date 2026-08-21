package com.tverseIQ.backend.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.tverseIQ.backend.dto.ParsedRowDto;
import com.tverseIQ.backend.model.AdsReportUpload;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Platform;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.AdsReportUploadRepository;
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
    private final AggregationEngine aggregationEngine;

    public ReportParserService(ChannelSkuMapRepository channelSkuMapRepository,
                               AdsReportUploadRepository uploadRepository,
                               SearchTermRowJdbcRepository searchTermRowJdbcRepository,
                               AggregationEngine aggregationEngine) {
        this.channelSkuMapRepository = channelSkuMapRepository;
        this.uploadRepository = uploadRepository;
        this.searchTermRowJdbcRepository = searchTermRowJdbcRepository;
        this.aggregationEngine = aggregationEngine;
    }

    @Async
    public void parseAndIngestReport(MultipartFile file, Platform platform, Long uploadId) {
        log.info("Job {}: Started async parsing for {} file", uploadId, platform);
        updateJobStatus(uploadId, "PROCESSING");

        try {
            AdsReportUpload uploadRecord = uploadRepository.findById(uploadId)
                    .orElseThrow(() -> new RuntimeException("Upload ID not found"));

            LocalDate periodStart = uploadRecord.getPeriodStart();
            LocalDate periodEnd = uploadRecord.getPeriodEnd();

            Map<String, Long> entityResolutionMap = channelSkuMapRepository.findByPlatform(platform)
                    .stream()
                    .collect(Collectors.toMap(
                            ChannelSkuMap::getChannelProductId,
                            (ChannelSkuMap map) -> map.getProduct().getProductId()
                    ));

            List<ParsedRowDto> batch = new ArrayList<>();

            if (platform == Platform.AMAZON) {
                parseAmazonExcel(file, batch, entityResolutionMap, uploadId, periodStart, periodEnd);
            } else if (platform == Platform.FLIPKART) {
                parseFlipkartCsv(file, batch, entityResolutionMap, uploadId, periodStart, periodEnd);
            }

            if (!batch.isEmpty()) {
                flushToDatabase(batch, uploadId, periodStart, periodEnd);
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
    private void parseAmazonExcel(MultipartFile file, List<ParsedRowDto> batch, Map<String, Long> resolutionMap,
                                  Long uploadId, LocalDate periodStart, LocalDate periodEnd) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String campaignName = getCellText(row.getCell(4));
                String adGroupName = getCellText(row.getCell(5));
                String keyword = getCellText(row.getCell(9));
                String matchType = getCellText(row.getCell(8));

                // Extracting Impressions & Clicks
                Integer impressions = getIntegerCell(row.getCell(12));
                Integer clicks = getIntegerCell(row.getCell(13));

                BigDecimal spend = getNumericCell(row.getCell(14));
                BigDecimal sales = getNumericCell(row.getCell(15));
                Integer orders = getIntegerCell(row.getCell(18));

                Long resolvedProductId = resolutionMap.get(adGroupName);

                if (resolvedProductId != null) {
                    // Mapped to match your exact DTO spelling: campaginName[cite: 10]
                    batch.add(new ParsedRowDto(resolvedProductId, campaignName, keyword, matchType, impressions, clicks, spend, orders, sales));
                    checkAndFlush(batch, uploadId, periodStart, periodEnd);
                }
            }
        }
    }

    // ==========================================
    // FLIPKART PARSER (CSV)
    // ==========================================
    private void parseFlipkartCsv(MultipartFile file, List<ParsedRowDto> batch, Map<String, Long> resolutionMap,
                                  Long uploadId, LocalDate periodStart, LocalDate periodEnd) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] cols;
            int lineNumber = 0;

            while ((cols = reader.readNext()) != null) {
                lineNumber++;
                if (lineNumber <= 3) continue;
                if (cols.length < 17) continue;

                String adGroupName = cols[1].trim();
                String campaignName = cols[3].trim();
                String keyword = cols[4].trim();

                Integer impressions = 0;
                Integer clicks = 0;

                Integer orders = Integer.parseInt(cols[9].trim()) + Integer.parseInt(cols[10].trim());
                BigDecimal sales = new BigDecimal(cols[13].trim()).add(new BigDecimal(cols[14].trim()));
                BigDecimal spend = new BigDecimal(cols[16].trim());
                String matchType = "BROAD";

                Long resolvedProductId = resolutionMap.get(campaignName);

                if (resolvedProductId != null) {
                    batch.add(new ParsedRowDto(resolvedProductId, campaignName, keyword, matchType, impressions, clicks, spend, orders, sales));
                    checkAndFlush(batch, uploadId, periodStart, periodEnd);
                }
            }
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================
    private void updateJobStatus(Long uploadId, String status) {
        uploadRepository.updateStatus(uploadId, status);
    }

    private void checkAndFlush(List<ParsedRowDto> batch, Long uploadId, LocalDate periodStart, LocalDate periodEnd) {
        if (batch.size() >= 1000) {
            flushToDatabase(batch, uploadId, periodStart, periodEnd);
            batch.clear();
        }
    }

    // The Critical Hand-off from Phase 1 to Phase 2
    private void flushToDatabase(List<ParsedRowDto> batch, Long uploadId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("Flushing batch of {} rows to the database...", batch.size());

        // 1. Save Raw Data
        searchTermRowJdbcRepository.batchUpsert(batch, uploadId, periodStart, periodEnd);

        // 2. Crunch the Metrics & Update Dashboard[cite: 4]
        aggregationEngine.processAndAggregateBatch(batch, 1, false, periodEnd);
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

    private Integer getIntegerCell(Cell cell) {
        if (cell == null || cell.getCellType() != CellType.NUMERIC) return 0;
        return (int) cell.getNumericCellValue();
    }
}