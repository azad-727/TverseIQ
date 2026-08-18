package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.dto.ParsedRowDto;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Repository
public class SearchTermRowJdbcRepository {

    private final JdbcTemplate jdbcTemplate;

    public SearchTermRowJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void batchUpsert(List<ParsedRowDto> batch, Long uploadId, LocalDate periodStart, LocalDate periodEnd) {

        // The native MySQL Upsert statement
        String sql = """
            INSERT INTO search_term_row 
            (upload_id, product_id, keyword, match_type, period_start, period_end, spend, orders, sales) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            spend = VALUES(spend), 
            orders = VALUES(orders), 
            sales = VALUES(sales)
            """;

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ParsedRowDto row = batch.get(i);

                // Map the DTO fields to the SQL '?' placeholders
                ps.setLong(1, uploadId);
                ps.setLong(2, row.productId());
                ps.setString(3, row.keyword());
                ps.setString(4, row.matchType());
                ps.setObject(5, periodStart);
                ps.setObject(6, periodEnd);
                ps.setBigDecimal(7, row.spend());
                ps.setBigDecimal(8, row.orders());
                ps.setBigDecimal(9, row.sales());
            }

            @Override
            public int getBatchSize() {
                return batch.size();
            }
        });
    }
}