package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "bioimpedance_import_job")
public class BioimpedanceImportJob extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImportJobStatus status = ImportJobStatus.PENDING;

    @Column(name = "source_file_name", nullable = false)
    private String sourceFileName;

    @Column(name = "source_file_hash", nullable = false, length = 64)
    private String sourceFileHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column
    private JsonNode result;

    @Column(length = 1000)
    private String error;

    @Column(name = "finished_at")
    private Instant finishedAt;
}
