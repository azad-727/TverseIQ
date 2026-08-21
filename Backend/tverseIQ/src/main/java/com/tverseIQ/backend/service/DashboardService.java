package com.tverseIQ.backend.service;

import com.tverseIQ.backend.dto.DashboardDto;
import com.tverseIQ.backend.model.ProductKeywordStats;
import com.tverseIQ.backend.repository.ProductKeywordStatsRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductKeywordStatsRepository statsRepository;

    public DashboardService(ProductKeywordStatsRepository statsRepository){
        this.statsRepository=statsRepository;
    }

    public List<DashboardDto.KeywordDeepDiveDto> getProductKeywords(Long productId){

        List<ProductKeywordStats> stats=statsRepository.findTopKeywordKeyset(productId,Long.MAX_VALUE,"",50);

        return stats.stream().map(stat->{
            BigDecimal clicks = BigDecimal.valueOf(stat.getCumulativeClicks());
            BigDecimal impressions = BigDecimal.valueOf(stat.getCumulativeImpressions());
            BigDecimal orders = BigDecimal.valueOf(stat.getCumulativeOrders());
            BigDecimal spend = stat.getCumulativeSpend();

            BigDecimal avgCpc = clicks.compareTo(BigDecimal.ZERO) > 0 ?
                    spend.divide(clicks,2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal avgCtr = impressions.compareTo(BigDecimal.ZERO) > 0
                    ? clicks.divide(impressions,4,RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                    :BigDecimal.ZERO;

            BigDecimal costPerPurchase = orders.compareTo(BigDecimal.ZERO) > 0
                    ? spend.divide(orders,4,RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                    :BigDecimal.ZERO;

            BigDecimal purchaseRate = clicks.compareTo(BigDecimal.ZERO) > 0
                    ? orders.divide(clicks,4,RoundingMode.HALF_UP).multiply(new BigDecimal("100"))
                    :BigDecimal.ZERO;

            boolean readyToGraduate = stat.getConfidenceScore().compareTo(new BigDecimal("0.8")) >=0
                    && stat.getCumulativeOrders() >=5;

            boolean isBleeding = spend.compareTo(new BigDecimal("500")) > 0
                    && stat.getCumulativeOrders() == 0;
            return new DashboardDto.KeywordDeepDiveDto(
                    stat.getKeyword(),
                    stat.getMatchType(),
                    stat.getCumulativeImpressions(),
                    stat.getCumulativeClicks(),
                    stat.getCumulativeOrders(),
                    spend,
                    stat.getCumulativeSales(),
                    avgCpc,
                    avgCtr,
                    costPerPurchase,
                    purchaseRate,
                    stat.getConsistencyIndex(),
                    stat.getSearchIntentScore(),
                    stat.getAttributionType(),
                    stat.getConfidenceScore(),
                    readyToGraduate,
                    isBleeding
            );
        }).collect(Collectors.toList());
    }
    public DashboardDto.GlobalMetricsDto getGlobalMetrics(){
        List<Object[]> results=statsRepository.getRawGlobalSums();

        if(results==null || results.isEmpty()||results.get(0)[0]==null){
            return new DashboardDto.GlobalMetricsDto(BigDecimal.ZERO,BigDecimal.ZERO,0,BigDecimal.ZERO,BigDecimal.ZERO);
        }
        Object[] row=results.get(0);

        BigDecimal totalSpend=new BigDecimal(row[0].toString());
        BigDecimal totalSales=new BigDecimal(row[1].toString());
        Integer totalOrders = ((Number) row[2]).intValue();

        BigDecimal roas = totalSpend.compareTo(BigDecimal.ZERO) > 0
                ? totalSales.divide(totalSpend, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal acos = totalSales.compareTo(BigDecimal.ZERO) > 0
                ? totalSpend.divide(totalSales, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new DashboardDto.GlobalMetricsDto(totalSpend, totalSales, totalOrders, roas, acos);
    }

}
