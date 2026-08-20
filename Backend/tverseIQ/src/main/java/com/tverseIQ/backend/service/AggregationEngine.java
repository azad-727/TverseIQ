package com.tverseIQ.backend.service;

import com.tverseIQ.backend.dto.ParsedRowDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class AggregationEngine {

    public void applyDeltaUpsert(List<ParsedRowDto> batch,int mappedProductCount,boolean hasAsin){

        BigDecimal confidenceScore;
        String attributionType;

        if(mappedProductCount==1){
            confidenceScore=BigDecimal.ONE;
            attributionType="CONFIRMED";
        } else if(hasAsin){
            confidenceScore=BigDecimal.ONE;
            attributionType="CONFIRMED";
        } else {
            confidenceScore=BigDecimal.ONE.divide(new BigDecimal(mappedProductCount),2, RoundingMode.HALF_UP);
            attributionType="SHARED";
        }

        for(ParsedRowDto row:batch){
            BigDecimal attributeSpend=row.spend()
                    .multiply(confidenceScore)
                    .setScale(2,RoundingMode.HALF_UP);
            BigDecimal attributeSales=row.sales()
                    .multiply(confidenceScore)
                    .setScale(2,RoundingMode.HALF_UP);

            int attributedOrders = Math.round(row.orders()*confidenceScore.floatValue());
        }
    }

}
