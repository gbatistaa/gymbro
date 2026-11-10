package com.gbatistadev.gymbro.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Liveness público.
 *
 * <p>Não toca o banco de propósito: o app usa este endpoint para distinguir "sem rede" de "erro de
 * negócio" antes de decidir entre mostrar falha de conexão e tratar a resposta da API.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
