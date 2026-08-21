package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.dto.DashboardDto;
import com.tverseIQ.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@CrossOrigin("/api/v1/dashboard")
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/global-metrics")
    public ResponseEntity<DashboardDto.GlobalMetricsDto> getGlobalMetrics() {
        return ResponseEntity.ok(dashboardService.getGlobalMetrics());
    }

}
