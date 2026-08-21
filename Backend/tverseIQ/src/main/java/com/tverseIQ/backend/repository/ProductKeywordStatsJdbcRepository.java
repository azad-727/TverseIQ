package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.ProductKeywordStats;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ProductKeywordStatsJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductKeywordStatsJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void batchDeltaUpsert(List<ProductKeywordStats> statsList) {
        String sql = """
            INSERT INTO product_keyword_stats (
                product_id, keyword, match_type, cumulative_impressions, cumulative_clicks,
                cumulative_orders, cumulative_spend, cumulative_sales, cvr, 
                attribution_type, confidence_score, times_appeared, 
                first_converted_date, last_converted_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                cumulative_impressions = cumulative_impressions + VALUES(cumulative_impressions),
                cumulative_clicks      = cumulative_clicks + VALUES(cumulative_clicks),
                cumulative_orders      = cumulative_orders + VALUES(cumulative_orders),
                cumulative_spend       = cumulative_spend + VALUES(cumulative_spend),
                cumulative_sales       = cumulative_sales + VALUES(cumulative_sales),
                times_appeared         = times_appeared + VALUES(times_appeared),
                cvr = CASE 
                    WHEN (cumulative_spend + VALUES(cumulative_spend)) > 0 
                    THEN (cumulative_orders + VALUES(cumulative_orders)) / (cumulative_spend + VALUES(cumulative_spend))
                    ELSE 0 
                END,
                attribution_type       = VALUES(attribution_type),
                confidence_score       = VALUES(confidence_score),
                last_converted_date    = GREATEST(COALESCE(last_converted_date, VALUES(last_converted_date)), VALUES(last_converted_date))
            """;

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ProductKeywordStats stat = statsList.get(i);
                ps.setLong(1, stat.getProductId());
                ps.setString(2, stat.getKeyword());
                ps.setString(3, stat.getMatchType());
                ps.setInt(4, stat.getCumulativeImpressions());
                ps.setInt(5, stat.getCumulativeClicks());
                ps.setInt(6, stat.getCumulativeOrders());
                ps.setBigDecimal(7, stat.getCumulativeSpend());
                ps.setBigDecimal(8, stat.getCumulativeSales());
                ps.setBigDecimal(9, stat.getCvr());
                ps.setString(10, stat.getAttributionType());
                ps.setBigDecimal(11, stat.getConfidenceScore());
                ps.setInt(12, stat.getTimesAppeared());
                ps.setDate(13, stat.getFirstConvertedData() != null ? Date.valueOf(stat.getFirstConvertedData()) : null);
                ps.setDate(14, stat.getLastConvertedDate() != null ? Date.valueOf(stat.getLastConvertedDate()) : null);
            }

            @Override
            public int getBatchSize() {
                return statsList.size();
            }
        });
    }
}