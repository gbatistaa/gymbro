package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.common.dto.PageDto;
import com.gbatistadev.gymbro.progress.dto.ExerciseProgressSummaryDto;
import com.gbatistadev.gymbro.progress.dto.ExerciseSeriesDto;
import com.gbatistadev.gymbro.progress.dto.PinnedExerciseDto;
import com.gbatistadev.gymbro.progress.dto.UpdatePinnedExercisesRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Painel de Progresso: exercícios fixados e evolução por exercício. */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {
    private final PinnedExerciseService pinnedService;
    private final ExerciseProgressService progressService;

    /** Exercícios já treinados, com busca, filtro por músculo, ordenação e paginação. */
    @GetMapping("/exercises")
    public ResponseEntity<PageDto<ExerciseProgressSummaryDto>> exercises(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String muscle,
        @RequestParam(defaultValue = "LAST_PERFORMED_AT") ExerciseProgressSort sort,
        @RequestParam(defaultValue = "DESC") SortDirection direction,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(progressService.list(
            new ExerciseProgressFilter(q, muscle, sort, direction, page, size)));
    }

    /** Evolução de um exercício em {@code [from, to)}, agrupada por dia, semana ou mês. */
    @GetMapping("/exercises/{exerciseId}/series")
    public ResponseEntity<ExerciseSeriesDto> series(
        @PathVariable UUID exerciseId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam SeriesBucket bucket
    ) {
        return ResponseEntity.ok(progressService.series(exerciseId, from, to, bucket));
    }

    @GetMapping("/pinned-exercises")
    public ResponseEntity<List<PinnedExerciseDto>> pinnedExercises() {
        return ResponseEntity.ok(pinnedService.list());
    }

    @PutMapping("/pinned-exercises")
    public ResponseEntity<List<PinnedExerciseDto>> replacePinnedExercises(
        @Valid @RequestBody UpdatePinnedExercisesRequest request
    ) {
        return ResponseEntity.ok(pinnedService.replace(request));
    }
}
