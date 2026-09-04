package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.dto.DashboardDto;
import com.tverseIQ.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/global-metrics")
    public ResponseEntity<DashboardDto.GlobalMetricsDto> getGlobalMetrics() {
        return ResponseEntity.ok(dashboardService.getGlobalMetrics());
    }

    @PostMapping("/discovery")
    public ResponseEntity<org.springframework.data.domain.Page<DashboardDto.KeywordDeepDiveDto>> discoverKeywords(
            @RequestBody(required = false) DashboardDto.KeywordFilterRequest filterRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        DashboardDto.KeywordFilterRequest request = (filterRequest != null)
                ? filterRequest
                : new DashboardDto.KeywordFilterRequest(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null, null);

        org.springframework.data.domain.Page<DashboardDto.KeywordDeepDiveDto> results = dashboardService.getFilteredKeywords(request, page, size);
        return ResponseEntity.ok(results);
    }

}
