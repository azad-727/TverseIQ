package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.ReturnRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReturnRecordRepository extends JpaRepository<ReturnRecord, String> {
    @Query("SELECT SUM(r.quantity) FROM ReturnRecord r WHERE r.sku = :sku")
    Long getTotalReturnedQtyBySku(@Param("sku") String sku);
}