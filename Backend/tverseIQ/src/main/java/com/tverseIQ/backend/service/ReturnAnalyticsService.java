package com.tverseIQ.backend.service;

import com.tverseIQ.backend.repository.OrderRecordRepository;
import com.tverseIQ.backend.repository.ReturnRecordRepository;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class ReturnAnalyticsService {

    private final OrderRecordRepository orderRepo;
    private final ReturnRecordRepository returnRepo;

    public ReturnAnalyticsService(OrderRecordRepository orderRepo, ReturnRecordRepository returnRepo) {
        this.orderRepo = orderRepo;
        this.returnRepo = returnRepo;
    }

    public Map<String, Object> calculateReturnRate(String sku) {
        Long totalOrders = orderRepo.getTotalOrderedQtyBySku(sku);
        Long totalReturns = returnRepo.getTotalReturnedQtyBySku(sku);

        if (totalOrders == null) totalOrders = 0L;
        if (totalReturns == null) totalReturns = 0L;

        double returnRate = 0.0;
        if (totalOrders > 0) {
            returnRate = ((double) totalReturns / totalOrders) * 100.0;
            returnRate = Math.round(returnRate * 100.0) / 100.0;
        }

        return Map.of(
                "sku", sku,
                "totalOrders", totalOrders,
                "totalReturns", totalReturns,
                "returnRatePct", returnRate
        );
    }
}