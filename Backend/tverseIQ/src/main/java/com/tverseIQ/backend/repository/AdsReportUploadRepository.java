package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.AdsReportUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AdsReportUploadRepository extends JpaRepository<AdsReportUpload,Long> {
    @Modifying
    @Transactional
    @Query("UPDATE AdsReportUpload a SET a.status = :status WHERE a.uploadId = :uploadId")
    void updateStatus(@Param("uploadId") Long uploadId, @Param("status") String status);
}
