package com.insurtech.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final Instant startTime = Instant.now();

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "insurtech-backend",
            "version", "0.0.1-SNAPSHOT",
            "uptimeSeconds", Instant.now().getEpochSecond() - startTime.getEpochSecond()
        );
    }
}
