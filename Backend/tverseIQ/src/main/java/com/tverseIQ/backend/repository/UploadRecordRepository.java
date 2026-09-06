package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.UploadRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UploadRecordRepository extends JpaRepository<UploadRecord, Long> {
    List<UploadRecord> findAllByOrderByUploadedAtDesc();
}