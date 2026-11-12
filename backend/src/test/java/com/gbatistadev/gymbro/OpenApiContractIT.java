package com.gbatistadev.gymbro;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Publica o contrato e grava o snapshot versionado em {@code docs/api/openapi.json}.
 *
 * <p>O arquivo é reescrito a cada execução de propósito: é artefato gerado, e o diff no git é o que
 * mostra quando um DTO mudou de forma. Quem consome é o script {@code api:types} do mobile.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("OpenAPI contract snapshot")
class OpenApiContractIT {

    private static final Path SNAPSHOT = Path.of("../docs/api/openapi.json");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("serves the contract without authentication and writes the snapshot")
    void shouldPublishContract() throws Exception {
        MvcResult result = mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode contract = objectMapper.readTree(result.getResponse().getContentAsString());

        assertTrue(contract.at("/paths").size() >= 20,
            "o contrato deve listar as rotas da API, veio: " + contract.at("/paths").size());

        JsonNode errorSchema = contract.at("/components/schemas/ErrorResponse");
        assertTrue(errorSchema.isObject(), "ErrorResponse precisa estar nos schemas");
        assertTrue(errorSchema.at("/properties/code").isObject(), "`code` deve aparecer no contrato");
        assertTrue(errorSchema.at("/properties/errors").isObject(), "`errors` deve aparecer no contrato");
        assertTrue(contract.at("/components/securitySchemes/cookieAuth").isObject(),
            "o contrato deve declarar o cookie de sessão do PWA");
        assertTrue(contract.at("/components/securitySchemes/bearerAuth").isObject(),
            "o contrato deve declarar o esquema Bearer para clientes não-browser");

        // contrato de login: um identificador que aceita e-mail ou username
        JsonNode login = contract.at("/components/schemas/LoginDto/properties");
        assertTrue(login.has("identifier"), "LoginDto deve expor `identifier`");
        assertTrue(login.has("password"), "LoginDto deve expor `password`");
        assertFalse(login.has("email"),
            "login não recebe mais `email` no corpo: o campo virou `identifier`");

        assertTrue(contract.at("/paths/~1api~1users~1me~1password/put").isObject(),
            "troca de senha precisa estar publicada");
        assertTrue(contract.at("/paths/~1api~1exercises~1muscles/get").isObject(),
            "a lista de músculos precisa estar publicada");
        assertTrue(contract.at("/paths/~1api~1dashboard~1muscle-volume/get/parameters").size() == 2,
            "volume por músculo expõe `from` e `to`");
        assertTrue(contract.at("/components/schemas/UserDto/properties/username").isObject(),
            "UserDto deve expor `username`");

        Files.createDirectories(SNAPSHOT.getParent());
        Files.writeString(SNAPSHOT,
            objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(contract) + "\n");
    }
}
