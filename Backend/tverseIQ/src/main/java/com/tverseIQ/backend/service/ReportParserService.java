package com.tverseIQ.backend.service;

import com.opencsv.CSVReader;
import com.tverseIQ.backend.dto.ParsedRowDto;
import com.tverseIQ.backend.model.AdsReportUpload;
import com.tverseIQ.backend.model.Campaign;
import com.tverseIQ.backend.model.Platform;
import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.repository.AdsReportUploadRepository;
import com.tverseIQ.backend.repository.CampaignRepository;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.SearchTermRowJdbcRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReportParserService {

    private final ChannelSkuMapRepository channelSkuMapRepository;
    private final AdsReportUploadRepository uploadRepository;
    private final SearchTermRowJdbcRepository searchTermRowJdbcRepository;
    private final AggregationEngine aggregationEngine;
    private final CampaignRepository campaignRepository;

    public ReportParserService(ChannelSkuMapRepository channelSkuMapRepository,
                               AdsReportUploadRepository uploadRepository,
                               SearchTermRowJdbcRepository searchTermRowJdbcRepository,
                               AggregationEngine aggregationEngine,
                               CampaignRepository campaignRepository) {
        this.channelSkuMapRepository = channelSkuMapRepository;
        this.uploadRepository = uploadRepository;
        this.searchTermRowJdbcRepository = searchTermRowJdbcRepository;
        this.aggregationEngine = aggregationEngine;
        this.campaignRepository = campaignRepository;
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

            Map<Integer, List<ParsedRowDto>> batchesByCount = new HashMap<>();
            Set<String> unmatchedCampaigns = new HashSet<>();

            // Build old fallback map
            Map<String, Long> fallbackMap = channelSkuMapRepository.findByPlatform(platform)
                    .stream()
                    .collect(Collectors.toMap(
                            ChannelSkuMap::getChannelProductId,
                            (ChannelSkuMap map) -> map.getProduct().getProductId(),
                            (existing, replacement) -> existing // prevent duplicates
                    ));

            if (platform == Platform.AMAZON) {
                parseAmazonExcel(file, batchesByCount, fallbackMap, unmatchedCampaigns, uploadId, periodStart, periodEnd);
            } else if (platform == Platform.FLIPKART) {
                parseFlipkartCsv(file, batchesByCount, fallbackMap, unmatchedCampaigns, uploadId, periodStart, periodEnd);
            }

            if (!unmatchedCampaigns.isEmpty()) {
                log.warn("Job {}: Could not find mappings in DB for the following strings found in the file: {}", uploadId, unmatchedCampaigns);
            }

            flushAllToDatabase(batchesByCount, uploadId, periodStart, periodEnd);

            updateJobStatus(uploadId, "COMPLETED");
            log.info("Job {}: Successfully completed.", uploadId);

        } catch (Exception e) {
            log.error("Job {}: Failed during parsing.", uploadId, e);
            updateJobStatus(uploadId, "FAILED");
        }
    }

    private void parseAmazonExcel(MultipartFile file, Map<Integer, List<ParsedRowDto>> batchesByCount,
                                  Map<String, Long> fallbackMap, Set<String> unmatched,
                                  Long uploadId, LocalDate periodStart, LocalDate periodEnd) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // 1. Dynamically scan for the Header Row
            Row headerRow = null;
            Map<String, Integer> columnMap = new java.util.HashMap<>();

            for (int i = 0; i < 5; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String firstCell = getCellText(row.getCell(0)).toLowerCase();
                // Find the row that contains column headers
                if (firstCell.contains("date") || firstCell.contains("campaign")) {
                    headerRow = row;
                    for (int j = 0; j < row.getLastCellNum(); j++) {
                        String header = getCellText(row.getCell(j)).toLowerCase().trim();
                        columnMap.put(header, j);
                    }
                    break;
                }
            }

            if (headerRow == null || columnMap.isEmpty()) {
                throw new RuntimeException("Could not find header row in Excel file!");
            }

            // 2. Safely find column indexes by name
            int campaignIdx = getIndex(columnMap, "campaign name", "campaign");
            int adGroupIdx = getIndex(columnMap, "ad group name", "ad group");
            int matchTypeIdx = getIndex(columnMap, "match type");
            int keywordIdx = getIndex(columnMap, "customer search term", "keyword");
            int impIdx = getIndex(columnMap, "impressions");
            int clicksIdx = getIndex(columnMap, "clicks");
            int spendIdx = getIndex(columnMap, "spend");
            int salesIdx = getIndex(columnMap, "7 day total sales", "total sales", "sales");
            int ordersIdx = getIndex(columnMap, "7 day total orders", "total orders", "orders");

            // 3. Process the data using the dynamic indexes
            for (int i = headerRow.getRowNum() + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String campaignName = campaignIdx != -1 ? getCellText(row.getCell(campaignIdx)) : "";
                String adGroupName = adGroupIdx != -1 ? getCellText(row.getCell(adGroupIdx)) : "";
                String matchType = matchTypeIdx != -1 ? getCellText(row.getCell(matchTypeIdx)) : "UNKNOWN";
                String keyword = keywordIdx != -1 ? getCellText(row.getCell(keywordIdx)) : "UNKNOWN";

                if (campaignName.isEmpty()) continue; // Skip empty rows

                Integer impressions = impIdx != -1 ? getIntegerCell(row.getCell(impIdx)) : 0;
                Integer clicks = clicksIdx != -1 ? getIntegerCell(row.getCell(clicksIdx)) : 0;
                BigDecimal spend = spendIdx != -1 ? getNumericCell(row.getCell(spendIdx)) : BigDecimal.ZERO;
                BigDecimal sales = salesIdx != -1 ? getNumericCell(row.getCell(salesIdx)) : BigDecimal.ZERO;
                Integer orders = ordersIdx != -1 ? getIntegerCell(row.getCell(ordersIdx)) : 0;

                processRowWithFallback(campaignName, adGroupName, keyword, matchType, impressions, clicks, spend, orders, sales, batchesByCount, fallbackMap, unmatched);
            }
        }
    }

    // Helper method to fuzzy match the header names
    private int getIndex(Map<String, Integer> columnMap, String... possibleNames) {
        for (String name : possibleNames) {
            for (Map.Entry<String, Integer> entry : columnMap.entrySet()) {
                if (entry.getKey().contains(name.toLowerCase())) {
                    return entry.getValue();
                }
            }
        }
        return -1;
    }

    private void parseFlipkartCsv(MultipartFile file, Map<Integer, List<ParsedRowDto>> batchesByCount,
                                  Map<String, Long> fallbackMap, Set<String> unmatched,
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

                processRowWithFallback(campaignName, adGroupName, keyword, matchType, impressions, clicks, spend, orders, sales, batchesByCount, fallbackMap, unmatched);
            }
        }
    }

    private void processRowWithFallback(String campaignName, String adGroupName, String keyword, String matchType,
                                        Integer impressions, Integer clicks, BigDecimal spend,
                                        Integer orders, BigDecimal sales,
                                        Map<Integer, List<ParsedRowDto>> batchesByCount,
                                        Map<String, Long> fallbackMap, Set<String> unmatched) {

        if (campaignName == null || campaignName.trim().isEmpty()) return;
        
        // Prevent nulls for primary database columns
        if (matchType == null || matchType.trim().isEmpty()) {
            matchType = "UNKNOWN";
        }
        if (keyword == null || keyword.trim().isEmpty()) {
            keyword = "UNKNOWN";
        }

        // 1. Try matching exact Campaign from UI mapping
        Optional<Campaign> optCampaign = campaignRepository.findByCampaignName(campaignName);
        if (optCampaign.isPresent()) {
            List<Product> mappedProducts = optCampaign.get().getMappedProducts();
            int productCount = mappedProducts.size();

            if (productCount > 0) {
                for (Product p : mappedProducts) {
                    ParsedRowDto dto = new ParsedRowDto(p.getProductId(), campaignName, keyword, matchType, impressions, clicks, spend, orders, sales);
                    batchesByCount.computeIfAbsent(productCount, k -> new ArrayList<>()).add(dto);
                }
                return; // Successfully mapped via Campaign!
            }
        }

        // 2. Fallback to old ChannelSkuMap logic (checks both AdGroupName and CampaignName)
        Long fallbackProductId = fallbackMap.get(adGroupName);
        if (fallbackProductId == null) {
            fallbackProductId = fallbackMap.get(campaignName);
        }

        if (fallbackProductId != null) {
            ParsedRowDto dto = new ParsedRowDto(fallbackProductId, campaignName, keyword, matchType, impressions, clicks, spend, orders, sales);
            batchesByCount.computeIfAbsent(1, k -> new ArrayList<>()).add(dto);
        } else {
            // Keep track of what we are missing to print a clean warning
            unmatched.add(campaignName);
        }
    }

    private void updateJobStatus(Long uploadId, String status) {
        uploadRepository.updateStatus(uploadId, status);
    }

    private void flushAllToDatabase(Map<Integer, List<ParsedRowDto>> batchesByCount, Long uploadId, LocalDate periodStart, LocalDate periodEnd) {
        for (Map.Entry<Integer, List<ParsedRowDto>> entry : batchesByCount.entrySet()) {
            int mappedProductCount = entry.getKey();
            List<ParsedRowDto> batch = entry.getValue();

            if (!batch.isEmpty()) {
                log.info("Flushing batch of {} rows for campaigns with {} mapped products...", batch.size(), mappedProductCount);
                searchTermRowJdbcRepository.batchUpsert(batch, uploadId, periodStart, periodEnd);
                aggregationEngine.processAndAggregateBatch(batch, mappedProductCount, false, periodEnd);
            }
        }
    }

    private String getCellText(Cell cell) {
        if (cell == null) return "";
        DataFormatter formatter = new DataFormatter();
        String text = formatter.formatCellValue(cell);

        // Remove standard spaces, non-breaking spaces (NBSP), and invisible unicode characters
        return text.replaceAll("[\\p{Zs}\\u200B\\uFEFF]+", " ")
                .replaceAll("[^\\x00-\\x7F]", "") // Strip non-ASCII
                .trim();
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