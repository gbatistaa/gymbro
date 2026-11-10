package com.gbatistadev.gymbro.bioimpedance.parser;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Component
@RequiredArgsConstructor
public class HttpBioimpedanceParser implements BioimpedanceParser {
    private final BioimpedanceParserProperties properties;

    @Override
    public JsonNode extract(byte[] file, String fileName) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file) {
            @Override
            public String getFilename() {
                return fileName;
            }
        });

        JsonNode response = restClient()
            .post()
            .uri("/extract")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(body)
            .retrieve()
            .body(JsonNode.class);

        if (response == null || !response.isObject()) {
            throw new IllegalStateException("The parser returned an invalid payload");
        }
        return response;
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout((int) properties.timeout().toMillis());

        return RestClient.builder()
            .baseUrl(properties.baseUrl())
            .requestFactory(factory)
            .build();
    }
}
