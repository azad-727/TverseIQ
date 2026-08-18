package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.model.AdsReportUpload;
import com.tverseIQ.backend.model.Platform;
import com.tverseIQ.backend.repository.AdsReportUploadRepository;
import com.tverseIQ.backend.service.ReportParserService;
import org.springframework.cglib.core.Local;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportUploadController {

    private final ReportParserService reportParserService;
    private final AdsReportUploadRepository adsReportUploadRepository;
    ReportUploadController(ReportParserService reportParserService,AdsReportUploadRepository adsReportUploadRepository){
        this.adsReportUploadRepository=adsReportUploadRepository;
        this.reportParserService=reportParserService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String,Object>> uploadReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("platform")Platform platform,
            @RequestParam("periodStart")LocalDate periodStart,
            @RequestParam("periodEnd") LocalDate periodEnd,
            @RequestParam("hasAsinColumn") boolean hasAsinColumn){

        AdsReportUpload upload=new AdsReportUpload();
        upload.setFileHash(String.valueOf(file.hashCode()));
        upload.setPeriodStart(periodStart);
        upload.setPeriodEnd(periodEnd);
        upload.setHasAsinColumn(hasAsinColumn);

        AdsReportUpload savedUpload = adsReportUploadRepository.save(upload);
        reportParserService.parseAndIngestReport(file,platform, savedUpload.getUploadId());
        Map<String,Object> response=new HashMap<>();
        response.put("message", "File upload accepted. Processing in background.");
        response.put("uploadId",savedUpload.getUploadId());
        response.put("status","PROCESSING");

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

}
