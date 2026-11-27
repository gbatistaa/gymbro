# syntax=docker/dockerfile:1
# API Spring Boot do Gymbro. Build com o Maven Wrapper do projeto; a imagem final só tem a JRE e o jar.

FROM eclipse-temurin:21.0.13.1_2-jdk AS build
WORKDIR /workspace

# dependências primeiro: mudar só o código não baixa o Maven de novo
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

COPY src/ src/
# os testes rodam fora da imagem (./mvnw test usa Testcontainers, que precisa do Docker do host)
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
    && cp target/gymbro-*.jar /workspace/app.jar

FROM eclipse-temurin:21.0.13.1_2-jre AS runtime
RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/app.jar ./app.jar
USER app

EXPOSE 8080
# a JVM respeita o limite de memória do contêiner
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=4 \
    CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
