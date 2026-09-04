package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.OrderRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRecordRepository extends JpaRepository<OrderRecord, String> {
    @Query("SELECT SUM(o.quantity) FROM OrderRecord o WHERE o.sku = :sku")
    Long getTotalOrderedQtyBySku(@Param("sku") String sku);
}