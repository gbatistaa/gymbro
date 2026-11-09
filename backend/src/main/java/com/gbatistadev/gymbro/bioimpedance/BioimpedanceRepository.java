package com.gbatistadev.gymbro.bioimpedance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BioimpedanceRepository
    extends JpaRepository<Bioimpedance, UUID>, JpaSpecificationExecutor<Bioimpedance> {

    Optional<Bioimpedance> findByIdAndUserId(UUID id, UUID userId);

    List<Bioimpedance> findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
        UUID userId, Instant from, Instant to);

    boolean existsByUserIdAndMeasuredAtAndDeletedAtIsNull(UUID userId, Instant measuredAt);

    boolean existsByUserIdAndSourceFileHashAndDeletedAtIsNull(UUID userId, String sourceFileHash);
}
