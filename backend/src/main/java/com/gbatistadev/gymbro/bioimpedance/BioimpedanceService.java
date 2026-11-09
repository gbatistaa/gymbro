package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.bioimpedance.dto.*;
import com.gbatistadev.gymbro.bioimpedance_logs.BioimpedanceLog;
import com.gbatistadev.gymbro.bioimpedance_logs.BioimpedanceLogRepository;
import com.gbatistadev.gymbro.bioimpedance_logs.enums.ActionType;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BioimpedanceService {
    private final BioimpedanceRepository repository;
    private final BioimpedanceLogRepository auditRepository;
    private final BioimpedanceMapper mapper;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;

    @Transactional
    public BioimpedanceDto create(CreateBioimpedanceRequest request) {
        return persist(request, "MANUAL");
    }

    @Transactional(readOnly = true)
    public List<BioimpedanceDto> list(Instant from, Instant to) {
        Instant start = from != null ? from : Instant.EPOCH;
        Instant end = to != null ? to : Instant.now();

        return repository
            .findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                currentUser.id(), start, end)
            .stream()
            .map(mapper::toDto)
            .toList();
    }

    @Transactional
    public BioimpedanceDto update(UUID id, UpdateBioimpedanceRequest request) {
        Bioimpedance entity = loadActive(id);

        validateMeasurement(
            request.measuredAt() != null ? request.measuredAt() : entity.getMeasuredAt(),
            request.bodyFatPercentage() != null ? request.bodyFatPercentage() : entity.getBodyFatPercentage(),
            request.muscleMassKg() != null ? request.muscleMassKg() : entity.getMuscleMassKg(),
            request.visceralFat() != null ? request.visceralFat() : entity.getVisceralFat(),
            request.waterPercentage() != null ? request.waterPercentage() : entity.getWaterPercentage(),
            request.bodyWeightKg() != null ? request.bodyWeightKg() : entity.getBodyWeightKg(),
            request.heightCm() != null ? request.heightCm() : entity.getHeightCm(),
            request.skeletalMuscleMassKg() != null
                ? request.skeletalMuscleMassKg() : entity.getSkeletalMuscleMassKg());

        if (request.measuredAt() != null
            && !request.measuredAt().equals(entity.getMeasuredAt())
            && repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(
                currentUser.id(), request.measuredAt())) {
            throw new ConflictException("A measurement already exists at that time");
        }

        BioimpedanceDto before = mapper.toDto(entity);
        mapper.updateEntity(request, entity);
        repository.save(entity);
        BioimpedanceDto after = mapper.toDto(entity);

        audit(entity, ActionType.UPDATE, before, after);
        return after;
    }

    @Transactional
    public void delete(UUID id) {
        Bioimpedance entity = repository.findByIdAndUserId(id, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Bioimpedance not found: " + id));

        if (entity.getDeletedAt() != null) {
            return;
        }

        BioimpedanceDto before = mapper.toDto(entity);
        entity.setDeletedAt(Instant.now());
        repository.save(entity);
        audit(entity, ActionType.DELETE, before, null);
    }

    @Transactional
    public ImportResponse importBatch(ImportBioimpedanceRequest request) {
        List<ImportResultItem> results = new ArrayList<>();
        int created = 0;
        int duplicates = 0;
        int errors = 0;

        for (int index = 0; index < request.items().size(); index++) {
            CreateBioimpedanceRequest item = request.items().get(index);
            try {
                BioimpedanceDto dto = persist(item, "IMPORT");
                results.add(new ImportResultItem(index, ImportStatus.CREATED, dto.id(), null));
                created++;
            } catch (ConflictException e) {
                results.add(new ImportResultItem(index, ImportStatus.DUPLICATE, null, e.getMessage()));
                duplicates++;
            } catch (BadRequestException e) {
                results.add(new ImportResultItem(index, ImportStatus.ERROR, null, e.getMessage()));
                errors++;
            }
        }

        return new ImportResponse(results, created, duplicates, errors);
    }

    @Transactional(readOnly = true)
    public List<BioimpedanceLogDto> history(UUID id) {
        repository.findByIdAndUserId(id, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Bioimpedance not found: " + id));

        return auditRepository.findByBioimpedanceIdOrderByCreatedAtDesc(id)
            .stream()
            .map(mapper::toDto)
            .toList();
    }

    private BioimpedanceDto persist(CreateBioimpedanceRequest request, String defaultSource) {
        validateMeasurement(
            request.measuredAt(),
            request.bodyFatPercentage(),
            request.muscleMassKg(),
            request.visceralFat(),
            request.waterPercentage(),
            request.bodyWeightKg(),
            request.heightCm(),
            request.skeletalMuscleMassKg());

        if (request.source() != null && request.source().length() > 30) {
            throw new BadRequestException("source must have at most 30 characters");
        }
        if (request.sourceFileHash() != null && request.sourceFileHash().length() > 64) {
            throw new BadRequestException("sourceFileHash must have at most 64 characters");
        }

        UUID userId = currentUser.id();
        if (repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, request.measuredAt())) {
            throw new ConflictException("A measurement already exists at that time");
        }
        if (request.sourceFileHash() != null
            && repository.existsByUserIdAndSourceFileHashAndDeletedAtIsNull(
                userId, request.sourceFileHash())) {
            throw new ConflictException("This file was already imported");
        }

        Bioimpedance entity = mapper.toEntity(request);
        entity.setUserId(userId);
        entity.setSource(
            request.source() == null || request.source().isBlank()
                ? defaultSource
                : request.source());
        repository.save(entity);

        BioimpedanceDto dto = mapper.toDto(entity);
        audit(entity, ActionType.INSERT, null, dto);
        return dto;
    }

    private void audit(
        Bioimpedance entity,
        ActionType actionType,
        BioimpedanceDto oldData,
        BioimpedanceDto newData
    ) {
        BioimpedanceLog log = new BioimpedanceLog();
        log.setBioimpedance(entity);
        log.setActionType(actionType);
        log.setOldData(oldData == null ? null : objectMapper.valueToTree(oldData));
        log.setNewData(newData == null ? null : objectMapper.valueToTree(newData));
        auditRepository.save(log);
    }

    private void validateMeasurement(
        Instant measuredAt,
        Double bodyFatPercentage,
        Double muscleMassKg,
        Double visceralFat,
        Double waterPercentage,
        Double bodyWeightKg,
        Double heightCm,
        Double skeletalMuscleMassKg
    ) {
        if (measuredAt == null) {
            throw new BadRequestException("measuredAt is required");
        }
        if (measuredAt.isAfter(Instant.now().plus(1, ChronoUnit.DAYS))) {
            throw new BadRequestException("measuredAt cannot be in the future");
        }
        if (bodyFatPercentage == null || bodyFatPercentage < 0 || bodyFatPercentage > 70) {
            throw new BadRequestException("bodyFatPercentage must be between 0 and 70");
        }
        if (muscleMassKg == null || muscleMassKg <= 0) {
            throw new BadRequestException("muscleMassKg must be positive");
        }
        if (visceralFat != null && (visceralFat < 0 || visceralFat > 60)) {
            throw new BadRequestException("visceralFat must be between 0 and 60");
        }
        if (waterPercentage != null && (waterPercentage < 0 || waterPercentage > 100)) {
            throw new BadRequestException("waterPercentage must be between 0 and 100");
        }
        if (bodyWeightKg != null && (bodyWeightKg < 20 || bodyWeightKg > 400)) {
            throw new BadRequestException("bodyWeightKg must be between 20 and 400");
        }
        if (heightCm != null && (heightCm < 100 || heightCm > 250)) {
            throw new BadRequestException("heightCm must be between 100 and 250");
        }
        if (skeletalMuscleMassKg != null && skeletalMuscleMassKg <= 0) {
            throw new BadRequestException("skeletalMuscleMassKg must be positive");
        }
    }

    private Bioimpedance loadActive(UUID id) {
        Bioimpedance entity = repository.findByIdAndUserId(id, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Bioimpedance not found: " + id));

        if (entity.getDeletedAt() != null) {
            throw new NotFoundException("Bioimpedance not found: " + id);
        }
        return entity;
    }
}
