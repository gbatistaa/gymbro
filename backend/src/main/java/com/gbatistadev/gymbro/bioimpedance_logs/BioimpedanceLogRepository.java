package com.gbatistadev.gymbro.bioimpedance_logs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface BioimpedanceLogRepository extends JpaRepository<BioimpedanceLog, UUID>, JpaSpecificationExecutor<BioimpedanceLog> {

    List<BioimpedanceLog> findByBioimpedanceIdOrderByCreatedAtDesc(UUID bioimpedanceId);
}