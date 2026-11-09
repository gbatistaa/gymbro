package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.bioimpedance.dto.*;
import com.gbatistadev.gymbro.bioimpedance_logs.BioimpedanceLog;
import com.gbatistadev.gymbro.bioimpedance_logs.BioimpedanceLogRepository;
import com.gbatistadev.gymbro.bioimpedance_logs.enums.ActionType;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceService")
class BioimpedanceServiceTest {

    @Mock
    private BioimpedanceRepository repository;

    @Mock
    private BioimpedanceLogRepository auditRepository;

    @Mock
    private BioimpedanceMapper mapper;

    @Mock
    private CurrentUser currentUser;

    @Spy
    private ObjectMapper objectMapper = JsonMapper.builder().build();

    @InjectMocks
    private BioimpedanceService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID measurementId = UUID.randomUUID();
    private final Instant measuredAt = Instant.parse("2026-11-01T08:00:00Z");

    @Test
    @DisplayName("create assigns the owner, source and writes an INSERT audit")
    void shouldCreateMeasurement() {
        CreateBioimpedanceRequest request = request(measuredAt, 18.0, null);
        Bioimpedance entity = new Bioimpedance();
        BioimpedanceDto expected = dto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, measuredAt))
            .thenReturn(false);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toDto(entity)).thenReturn(expected);

        assertSame(expected, service.create(request));
        assertEquals(userId, entity.getUserId());
        assertEquals("MANUAL", entity.getSource());
        verify(auditRepository).save(argThat(
            log -> log.getActionType() == ActionType.INSERT
                && log.getOldData() == null
                && log.getNewData() != null));
    }

    @Test
    @DisplayName("create rejects a duplicated measurement timestamp")
    void shouldRejectDuplicateTimestamp() {
        CreateBioimpedanceRequest request = request(measuredAt, 18.0, null);

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, measuredAt))
            .thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(request));
        verify(repository, never()).save(any());
        verifyNoInteractions(auditRepository);
    }

    @Test
    @DisplayName("create rejects a file hash that was already imported")
    void shouldRejectDuplicateFileHash() {
        CreateBioimpedanceRequest request = request(measuredAt, 18.0, "abc123");

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, measuredAt))
            .thenReturn(false);
        when(repository.existsByUserIdAndSourceFileHashAndDeletedAtIsNull(userId, "abc123"))
            .thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("validation rejects a body fat out of range before touching the database")
    void shouldRejectInvalidMeasurement() {
        CreateBioimpedanceRequest request = request(measuredAt, 90.0, null);

        assertThrows(BadRequestException.class, () -> service.create(request));
        verifyNoInteractions(repository, auditRepository, currentUser);
    }

    @Test
    @DisplayName("import reports CREATED, DUPLICATE and ERROR per item")
    void shouldImportBatchPerItem() {
        Instant first = measuredAt;
        Instant duplicate = measuredAt.plusSeconds(86400);
        Instant invalid = measuredAt.plusSeconds(172800);

        CreateBioimpedanceRequest valid = request(first, 18.0, null);
        CreateBioimpedanceRequest repeated = request(duplicate, 18.0, null);
        CreateBioimpedanceRequest broken = request(invalid, 90.0, null);

        Bioimpedance entity = new Bioimpedance();
        BioimpedanceDto created = dto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, first))
            .thenReturn(false);
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, duplicate))
            .thenReturn(true);
        when(mapper.toEntity(valid)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.toDto(entity)).thenReturn(created);

        ImportResponse response = service.importBatch(
            new ImportBioimpedanceRequest(List.of(valid, repeated, broken)));

        assertEquals(1, response.created());
        assertEquals(1, response.duplicates());
        assertEquals(1, response.errors());
        assertEquals(ImportStatus.CREATED, response.results().get(0).status());
        assertEquals(ImportStatus.DUPLICATE, response.results().get(1).status());
        assertEquals(ImportStatus.ERROR, response.results().get(2).status());
        verify(auditRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("update writes the before/after snapshot")
    void shouldUpdateAndAudit() {
        Bioimpedance entity = existing();
        Instant newMeasuredAt = measuredAt.plusSeconds(3600);
        UpdateBioimpedanceRequest request =
            new UpdateBioimpedanceRequest(newMeasuredAt, 17.0, null, null, null, null, null, null, null, null);
        BioimpedanceDto before = dto();
        BioimpedanceDto after = dto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.findByIdAndUserId(measurementId, userId)).thenReturn(Optional.of(entity));
        when(repository.existsByUserIdAndMeasuredAtAndDeletedAtIsNull(userId, newMeasuredAt))
            .thenReturn(false);
        when(mapper.toDto(entity)).thenReturn(before, after);

        assertSame(after, service.update(measurementId, request));

        verify(mapper).updateEntity(request, entity);
        verify(repository).save(entity);
        verify(auditRepository).save(argThat(
            log -> log.getActionType() == ActionType.UPDATE
                && log.getOldData() != null
                && log.getNewData() != null));
    }

    @Test
    @DisplayName("update hides a deleted measurement")
    void shouldHideDeletedMeasurementOnUpdate() {
        Bioimpedance entity = existing();
        entity.setDeletedAt(Instant.now());

        when(currentUser.id()).thenReturn(userId);
        when(repository.findByIdAndUserId(measurementId, userId)).thenReturn(Optional.of(entity));

        assertThrows(NotFoundException.class, () -> service.update(
            measurementId,
            new UpdateBioimpedanceRequest(null, 17.0, null, null, null, null, null, null, null, null)));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("delete soft-deletes and audits only once")
    void shouldSoftDeleteIdempotently() {
        Bioimpedance entity = existing();
        BioimpedanceDto before = dto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.findByIdAndUserId(measurementId, userId)).thenReturn(Optional.of(entity));
        when(mapper.toDto(entity)).thenReturn(before);

        service.delete(measurementId);
        service.delete(measurementId);

        assertNotNull(entity.getDeletedAt());
        verify(repository, times(1)).save(entity);
        verify(auditRepository, times(1)).save(argThat(
            log -> log.getActionType() == ActionType.DELETE
                && log.getOldData() != null
                && log.getNewData() == null));
    }

    @Test
    @DisplayName("list maps measurements for the current user")
    void shouldListMeasurements() {
        Bioimpedance entity = existing();
        BioimpedanceDto expected = dto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(Instant.class), any(Instant.class)))
            .thenReturn(List.of(entity));
        when(mapper.toDto(entity)).thenReturn(expected);

        assertEquals(List.of(expected), service.list(null, null));
    }

    @Test
    @DisplayName("history maps the audit rows")
    void shouldReturnHistory() {
        Bioimpedance entity = existing();
        BioimpedanceLog log = new BioimpedanceLog();
        BioimpedanceLogDto expected =
            new BioimpedanceLogDto(UUID.randomUUID(), ActionType.INSERT, null, null, Instant.now());

        when(currentUser.id()).thenReturn(userId);
        when(repository.findByIdAndUserId(measurementId, userId)).thenReturn(Optional.of(entity));
        when(auditRepository.findByBioimpedanceIdOrderByCreatedAtDesc(measurementId))
            .thenReturn(List.of(log));
        when(mapper.toDto(log)).thenReturn(expected);

        assertEquals(List.of(expected), service.history(measurementId));
    }

    private CreateBioimpedanceRequest request(Instant at, double bodyFat, String fileHash) {
        return new CreateBioimpedanceRequest(
            at, bodyFat, 38.0, 8.0, 55.0, 82.0, 178.0, 36.0, null, fileHash);
    }

    private Bioimpedance existing() {
        Bioimpedance entity = new Bioimpedance();
        entity.setId(measurementId);
        entity.setUserId(userId);
        entity.setMeasuredAt(measuredAt);
        entity.setBodyFatPercentage(18.0);
        entity.setMuscleMassKg(38.0);
        entity.setVisceralFat(8.0);
        entity.setWaterPercentage(55.0);
        entity.setBodyWeightKg(82.0);
        entity.setHeightCm(178.0);
        entity.setSkeletalMuscleMassKg(36.0);
        entity.setSource("MANUAL");
        return entity;
    }

    private BioimpedanceDto dto() {
        return new BioimpedanceDto(
            measurementId, measuredAt, 82.0, 178.0, 18.0, 38.0, 36.0, 8.0, 55.0, "MANUAL", null);
    }
}
