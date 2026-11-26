package com.gbatistadev.gymbro.completion;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.completion.dto.CompletionDto;
import com.gbatistadev.gymbro.completion.dto.CompletionSummaryDto;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompletionService {
    private final WorkoutCompletionRepository completions;
    private final PlaylistRepository playlists;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final Clock clock;

    @Transactional
    public CompletionDto complete(UUID playlistId) {
        UUID userId = currentUser.id();
        Playlist playlist = playlists.findByIdAndUserId(playlistId, userId)
            .orElseThrow(() -> new NotFoundException("Playlist not found: " + playlistId));

        if (playlist.getArchivedAt() != null) {
            throw new ConflictException("PLAYLIST_ARCHIVED", "Archived routines cannot be marked as done");
        }

        WorkoutCompletion completion = new WorkoutCompletion();
        completion.setUserId(userId);
        completion.setPlaylist(playlist);
        completion.setCompletedAt(clock.instant());

        return toDto(completions.save(completion));
    }

    @Transactional(readOnly = true)
    public List<CompletionDto> recent(int size) {
        int pageSize = Math.clamp(size, 1, 50);
        return completions.findByUserIdOrderByCompletedAtDesc(
                currentUser.id(),
                PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "completedAt")))
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public CompletionSummaryDto summary() {
        UUID userId = currentUser.id();
        ZoneId zone = userZone(userId);

        LocalDate currentWeek = LocalDate.now(clock.withZone(zone))
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = currentWeek.atStartOfDay(zone).toInstant();
        Instant weekEnd = currentWeek.plusWeeks(1).atStartOfDay(zone).toInstant();

        return new CompletionSummaryDto(
            completions.countByUserId(userId),
            completions.countByUserIdAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                userId, weekStart, weekEnd));
    }

    @Transactional
    public void delete(UUID completionId) {
        WorkoutCompletion completion = completions.findByIdAndUserId(completionId, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Completion not found: " + completionId));

        completions.delete(completion);
    }

    private ZoneId userZone(UUID userId) {
        return users.findById(userId)
            .map(user -> ZoneId.of(user.getTimezone()))
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private CompletionDto toDto(WorkoutCompletion completion) {
        return new CompletionDto(
            completion.getId(),
            completion.getPlaylist().getId(),
            completion.getPlaylist().getName(),
            completion.getCompletedAt());
    }
}
