package com.gbatistadev.gymbro.bioimpedance.parser;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("HttpBioimpedanceParser")
class HttpBioimpedanceParserTest {

    @Test
    @DisplayName("sends the shared token and parses the JSON response")
    void shouldSendParserToken() throws Exception {
        AtomicReference<String> receivedToken = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/extract", exchange -> {
            exchange.getRequestBody().readAllBytes();
            receivedToken.set(exchange.getRequestHeaders().getFirst("X-Parser-Token"));
            byte[] body = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();

        try {
            HttpBioimpedanceParser parser = new HttpBioimpedanceParser(
                new BioimpedanceParserProperties(
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    Duration.ofSeconds(5),
                    "secret-token"));

            JsonNode result = parser.extract(
                "%PDF-1.4".getBytes(StandardCharsets.ISO_8859_1), "inbody.pdf");

            assertEquals("secret-token", receivedToken.get());
            assertTrue(result.get("ok").asBoolean());
        } finally {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("interoperates with the normalized extraction contract")
    void shouldReadNormalizedExtraction() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/extract", exchange -> {
            exchange.getRequestBody().readAllBytes();
            byte[] body = "{\"measuredAt\":\"2026-10-01T08:00:00Z\",\"bodyWeightKg\":82.4,\"skeletalMuscleMassKg\":null,\"missingFields\":[\"skeletalMuscleMassKg\"]}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            JsonNode result = new HttpBioimpedanceParser(new BioimpedanceParserProperties(
                "http://127.0.0.1:" + server.getAddress().getPort(), Duration.ofSeconds(5), ""))
                .extract("%PDF-1.4".getBytes(StandardCharsets.ISO_8859_1), "inbody.pdf");
            assertEquals("2026-10-01T08:00:00Z", result.get("measuredAt").asText());
            assertEquals(82.4, result.get("bodyWeightKg").asDouble());
            assertTrue(result.get("skeletalMuscleMassKg").isNull());
            assertEquals("skeletalMuscleMassKg", result.get("missingFields").get(0).textValue());
        } finally {
            server.stop(0);
        }
    }
}
