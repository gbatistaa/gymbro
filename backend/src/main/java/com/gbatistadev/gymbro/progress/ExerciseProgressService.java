package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.common.dto.PageDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.progress.dto.ExerciseProgressSummaryDto;
import com.gbatistadev.gymbro.progress.dto.ExerciseSeriesDto;
import com.gbatistadev.gymbro.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExerciseProgressService {
    static final int MAX_PAGE_SIZE = 50;

    private final ExerciseProgressRepository progress;
    private final ExerciseRepository exercises;
    private final UserRepository users;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public PageDto<ExerciseProgressSummaryDto> list(ExerciseProgressFilter filter) {
        if (filter.page() < 0 || filter.size() < 1 || filter.size() > MAX_PAGE_SIZE) {
            throw new BadRequestException(
                "INVALID_PAGE", "page must be >= 0 and size between 1 and " + MAX_PAGE_SIZE);
        }

        UUID userId = currentUser.id();
        ExerciseProgressFilter normalized = new ExerciseProgressFilter(
            normalize(filter.search()),
            normalize(filter.muscle()),
            filter.sort(),
            filter.direction(),
            filter.page(),
            filter.size());

        long total = progress.countSummaries(userId, normalized);
        List<ExerciseProgressSummaryDto> content = total == 0
            ? List.of()
            : progress.findSummaries(userId, normalized);
        int totalPages = (int) ((total + filter.size() - 1) / filter.size());

        return new PageDto<>(content, filter.page(), filter.size(), total, totalPages);
    }

    @Transactional(readOnly = true)
    public ExerciseSeriesDto series(UUID exerciseId, Instant from, Instant to, SeriesBucket bucket) {
        if (!from.isBefore(to)) {
            throw new BadRequestException("INVALID_RANGE", "from must be before to");
        }

        UUID userId = currentUser.id();
        Exercise exercise = exercises.findByIdForUser(exerciseId, userId)
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + exerciseId));

        return new ExerciseSeriesDto(
            exercise.getId(),
            exercise.getName(),
            exercise.getPrimaryMuscle(),
            bucket,
            from,
            to,
            progress.findSeries(userId, exerciseId, from, to, bucket, userZone(userId)),
            progress.summarizeSeries(userId, exerciseId, from, to));
    }

    private ZoneId userZone(UUID userId) {
        return users.findById(userId)
            .map(user -> ZoneId.of(user.getTimezone()))
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
