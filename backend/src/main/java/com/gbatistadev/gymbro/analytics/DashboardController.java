package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.DashboardDto;
import com.gbatistadev.gymbro.analytics.dto.MuscleVolumeDto;
import org.springframework.format.annotation.DateTimeFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService service;

    @GetMapping
    public ResponseEntity<DashboardDto> dashboard(
        @RequestParam(defaultValue = "12") int weeks
    ) {
        return ResponseEntity.ok(service.dashboard(weeks));
    }

    @GetMapping("/muscle-volume")
    public ResponseEntity<List<MuscleVolumeDto>> muscleVolume(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(service.muscleVolume(from, to));
    }
}
