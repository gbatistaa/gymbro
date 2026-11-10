package com.gbatistadev.gymbro.bioimpedance.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface BioimpedanceImportJobRepository extends JpaRepository<BioimpedanceImportJob, UUID> {

    Optional<BioimpedanceImportJob> findByIdAndUserId(UUID id, UUID userId);

    Optional<BioimpedanceImportJob> findFirstByUserIdAndSourceFileHashAndStatusInOrderByCreatedAtDesc(
        UUID userId, String sourceFileHash, Collection<ImportJobStatus> statuses);
}
