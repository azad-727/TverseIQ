package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="ads_reports_upload")
@Getter
@Setter
public class AdsReportUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="fileHash",nullable = false,unique = true,length = 64)
    private String fileHash;

    @Column(name="uploadedAt",nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name="periodStart",nullable = false)
    private LocalDate periodStart;

    @Column(name="periodEnd",nullable = false)
    private LocalDate periodEnd;

    @Column(name="hasAsinColumn",nullable = false)
    private Boolean hasAsinColumn;

    @Column(nullable = false,length = 20)
    private String status;

    @PrePersist
    protected  void onCreate(){
        this.uploadedAt=LocalDateTime.now();
        if(this.status == null){
            this.status="PROCESSING";
        }
    }


}
