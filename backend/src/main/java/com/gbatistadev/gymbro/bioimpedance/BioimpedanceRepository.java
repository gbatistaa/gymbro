package com.gbatistadev.gymbro.bioimpedance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface BioimpedanceRepository extends JpaRepository<Bioimpedance, UUID>, JpaSpecificationExecutor<Bioimpedance> {
}