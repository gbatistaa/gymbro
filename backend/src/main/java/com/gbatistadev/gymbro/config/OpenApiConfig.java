package com.gbatistadev.gymbro.config;

import com.gbatistadev.gymbro.errors.ErrorResponse;
import com.gbatistadev.gymbro.errors.FieldErrorDto;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.core.converter.ResolvedSchema;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Publica no contrato os schemas de erro.
 *
 * <p>O springdoc não enxerga {@code @RestControllerAdvice}: sem isto, {@link ErrorResponse} não
 * aparece em {@code components/schemas} e o cliente não tem como tipar o corpo de erro — que é
 * justamente o que o {@code docs/adr/0001-contrato-de-erro.md} promete.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI gymbroOpenApi() {
        // declarado sem exigência global: /api/auth/** é público e o resto é autenticado por header
        return new OpenAPI()
            .info(new Info().title("Gymbro API").version("1"))
            .components(new Components().addSecuritySchemes("bearerAuth",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }

    @Bean
    OpenApiCustomizer errorSchemasCustomizer() {
        return openApi -> {
            Components components = openApi.getComponents() == null
                ? new Components()
                : openApi.getComponents();
            openApi.setComponents(components);

            register(components, ErrorResponse.class);
            register(components, FieldErrorDto.class);
        };
    }

    /** Deriva o schema da própria classe para não duplicar o DTO à mão no contrato. */
    private void register(Components components, Class<?> type) {
        ResolvedSchema resolved = ModelConverters.getInstance().readAllAsResolvedSchema(type);
        resolved.referencedSchemas.forEach(components::addSchemas);
        if (resolved.schema != null) {
            components.addSchemas(resolved.schema.getName(), resolved.schema);
        }
    }
}
