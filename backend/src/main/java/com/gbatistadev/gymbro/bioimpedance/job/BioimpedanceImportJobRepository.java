package com.gbatistadev.gymbro.bioimpedance.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BioimpedanceImportJobRepository extends JpaRepository<BioimpedanceImportJob, UUID> {

    Optional<BioimpedanceImportJob> findByIdAndUserId(UUID id, UUID userId);

    /** Most recent open (not yet confirmed) job for the same file. */
    Optional<BioimpedanceImportJob>
        findFirstByUserIdAndSourceFileHashAndStatusInAndBioimpedanceIdIsNullOrderByCreatedAtDesc(
            UUID userId, String sourceFileHash, Collection<ImportJobStatus> statuses);

    /** Imports waiting for the user: processing, ready for review or failed. */
    List<BioimpedanceImportJob> findByUserIdAndBioimpedanceIdIsNullOrderByCreatedAtDesc(UUID userId);

    List<BioimpedanceImportJob> findByStatusAndUpdatedAtBefore(
        ImportJobStatus status, Instant cutoff);
}
