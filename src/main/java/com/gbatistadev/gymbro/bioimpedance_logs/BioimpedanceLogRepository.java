package com.gbatistadev.gymbro.bioimpedance_logs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface BioimpedanceLogRepository extends JpaRepository<BioimpedanceLog, UUID>, JpaSpecificationExecutor<BioimpedanceLog> {
}