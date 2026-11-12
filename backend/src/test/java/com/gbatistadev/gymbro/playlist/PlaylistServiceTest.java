package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.dto.*;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PlaylistService")
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlists;

    @Mock
    private PlaylistExerciseRepository items;

    @Mock
    private ExerciseRepository exercises;

    @Mock
    private PlaylistMapper mapper;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private PlaylistService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID playlistId = UUID.randomUUID();

    @Test
    @DisplayName("create assigns the current user as owner")
    void shouldCreatePlaylist() {
        CreatePlaylistRequest request = new CreatePlaylistRequest("Push", "Chest day");
        Playlist entity = new Playlist();
        PlaylistDto expected = playlistDto();

        when(currentUser.id()).thenReturn(userId);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(playlists.save(entity)).thenReturn(entity);
        when(mapper.toDto(entity)).thenReturn(expected);

        assertSame(expected, service.create(request));
        assertEquals(userId, entity.getUserId());
    }

    @Test
    @DisplayName("list returns only active playlists by default")
    void shouldListActivePlaylists() {
        PlaylistSummaryDto expected = playlistSummary(playlistId, 2, null);

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findSummariesByUserId(userId, false, SessionStatus.FINISHED))
            .thenReturn(List.of(expected));

        assertEquals(List.of(expected), service.list(false));
    }

    @Test
    @DisplayName("list includes archived playlists when asked")
    void shouldListArchivedPlaylists() {
        PlaylistSummaryDto expected = playlistSummary(playlistId, 0, null);

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findSummariesByUserId(userId, true, SessionStatus.FINISHED))
            .thenReturn(List.of(expected));

        assertEquals(List.of(expected), service.list(true));
    }

    @Test
    @DisplayName("detail returns the playlist with its ordered exercises")
    void shouldReturnPlaylistDetail() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistExercise item = item(UUID.randomUUID(), 0);
        PlaylistExerciseDto itemDto = itemDto(item.getId());
        PlaylistDetailDto expected = new PlaylistDetailDto(
            playlistId, "Push", null, null, List.of(itemDto));

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(items.findDetailByPlaylistId(playlistId)).thenReturn(List.of(item));
        when(mapper.toDto(item)).thenReturn(itemDto);
        when(mapper.toDetail(playlist, List.of(itemDto))).thenReturn(expected);

        assertSame(expected, service.detail(playlistId));
    }

    @Test
    @DisplayName("clone copies the playlist and every exercise")
    void shouldClonePlaylist() {
        Playlist source = playlist(playlistId, null);
        source.setName("Push");
        Playlist copy = new Playlist();
        PlaylistExercise sourceItem = item(UUID.randomUUID(), 0);
        PlaylistExercise clonedItem = new PlaylistExercise();
        PlaylistDto expected = playlistDto();

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(source));
        when(mapper.toCopy(source)).thenReturn(copy);
        when(playlists.save(copy)).thenReturn(copy);
        when(items.findByPlaylistIdOrderByOrderIndexAsc(playlistId))
            .thenReturn(List.of(sourceItem));
        when(mapper.toCopy(sourceItem)).thenReturn(clonedItem);
        when(mapper.toDto(copy)).thenReturn(expected);

        assertSame(expected, service.clone(playlistId));
        assertEquals("Push (cópia)", copy.getName());
        assertEquals(userId, copy.getUserId());
        assertEquals(copy, clonedItem.getPlaylist());
        verify(items).save(clonedItem);
    }

    @Test
    @DisplayName("archived playlists are read-only")
    void shouldRejectUpdateOfArchivedPlaylist() {
        Playlist archived = playlist(playlistId, Instant.now());

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(archived));

        assertThrows(ConflictException.class,
            () -> service.update(playlistId, new UpdatePlaylistRequest("New", null)));
        verify(playlists, never()).save(any());
    }

    @Test
    @DisplayName("archive is idempotent")
    void shouldArchivePlaylistIdempotently() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistDto expected = playlistDto();

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(playlists.save(playlist)).thenReturn(playlist);
        when(mapper.toDto(playlist)).thenReturn(expected);

        service.archive(playlistId);
        service.archive(playlistId);

        assertNotNull(playlist.getArchivedAt());
        verify(playlists, times(1)).save(playlist);
    }

    @Test
    @DisplayName("addExercise appends the exercise at the end of the routine")
    void shouldAddExercise() {
        Playlist playlist = playlist(playlistId, null);
        Exercise exercise = exercise(false);
        AddPlaylistExerciseRequest request = new AddPlaylistExerciseRequest(
            exercise.getId(), 3, 8, 12, 90, "controlled");
        PlaylistExerciseDto expected = itemDto(UUID.randomUUID());

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(exercises.findByIdForUser(exercise.getId(), userId)).thenReturn(Optional.of(exercise));
        when(items.maxOrderIndex(playlistId)).thenReturn(1);
        when(mapper.toEntity(request)).thenReturn(new PlaylistExercise());
        when(items.save(any(PlaylistExercise.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(mapper.toDto(any(PlaylistExercise.class))).thenReturn(expected);

        assertSame(expected, service.addExercise(playlistId, request));

        ArgumentCaptor<PlaylistExercise> captor = ArgumentCaptor.forClass(PlaylistExercise.class);
        verify(items).save(captor.capture());
        assertEquals(playlist, captor.getValue().getPlaylist());
        assertEquals(exercise, captor.getValue().getExercise());
        assertEquals(2, captor.getValue().getOrderIndex());
    }

    @Test
    @DisplayName("addExercise rejects an archived exercise")
    void shouldRejectArchivedExercise() {
        Playlist playlist = playlist(playlistId, null);
        Exercise exercise = exercise(true);
        AddPlaylistExerciseRequest request = new AddPlaylistExerciseRequest(
            exercise.getId(), 3, null, null, null, null);

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(exercises.findByIdForUser(exercise.getId(), userId)).thenReturn(Optional.of(exercise));

        assertThrows(ConflictException.class, () -> service.addExercise(playlistId, request));
        verify(items, never()).save(any());
    }

    @Test
    @DisplayName("addExercise rejects an inverted rep range")
    void shouldRejectInvertedRepRange() {
        Playlist playlist = playlist(playlistId, null);
        Exercise exercise = exercise(false);
        AddPlaylistExerciseRequest request = new AddPlaylistExerciseRequest(
            exercise.getId(), 3, 12, 8, null, null);

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(exercises.findByIdForUser(exercise.getId(), userId)).thenReturn(Optional.of(exercise));

        assertThrows(ConflictException.class, () -> service.addExercise(playlistId, request));
        verify(items, never()).save(any());
    }

    @Test
    @DisplayName("removeExercise deletes and reindexes the remaining items")
    void shouldRemoveExerciseAndReindex() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistExercise removed = item(UUID.randomUUID(), 1);
        PlaylistExercise first = item(UUID.randomUUID(), 0);
        PlaylistExercise last = item(UUID.randomUUID(), 2);

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(items.findByIdAndPlaylistId(removed.getId(), playlistId))
            .thenReturn(Optional.of(removed));
        when(items.findByPlaylistIdOrderByOrderIndexAsc(playlistId))
            .thenReturn(List.of(first, last));

        service.removeExercise(playlistId, removed.getId());

        verify(items).delete(removed);
        verify(items).flush();
        assertEquals(0, first.getOrderIndex());
        assertEquals(1, last.getOrderIndex());
        verify(items).saveAll(List.of(first, last));
    }

    @Test
    @DisplayName("reorder applies every new index in one batch")
    void shouldReorderItems() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistExercise first = item(UUID.randomUUID(), 0);
        PlaylistExercise second = item(UUID.randomUUID(), 1);
        ReorderRequest request = new ReorderRequest(List.of(
            new ReorderRequest.ReorderItem(first.getId(), 1),
            new ReorderRequest.ReorderItem(second.getId(), 0)));

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(items.findByPlaylistIdOrderByOrderIndexAsc(playlistId))
            .thenReturn(List.of(first, second));
        when(items.findDetailByPlaylistId(playlistId)).thenReturn(List.of(first, second));
        when(mapper.toDto(any(PlaylistExercise.class))).thenReturn(itemDto(first.getId()));
        when(mapper.toDetail(eq(playlist), anyList())).thenReturn(
            new PlaylistDetailDto(playlistId, "Push", null, null, List.of()));

        service.reorder(playlistId, request);

        assertEquals(1, first.getOrderIndex());
        assertEquals(0, second.getOrderIndex());
        verify(items).saveAll(List.of(first, second));
    }

    @Test
    @DisplayName("reorder rejects a missing item")
    void shouldRejectIncompleteReorder() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistExercise first = item(UUID.randomUUID(), 0);
        PlaylistExercise second = item(UUID.randomUUID(), 1);
        ReorderRequest request = new ReorderRequest(List.of(
            new ReorderRequest.ReorderItem(first.getId(), 0)));

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(items.findByPlaylistIdOrderByOrderIndexAsc(playlistId))
            .thenReturn(List.of(first, second));

        assertThrows(ConflictException.class, () -> service.reorder(playlistId, request));
        verify(items, never()).saveAll(any());
    }

    @Test
    @DisplayName("reorder rejects duplicated indices")
    void shouldRejectRepeatedOrderIndex() {
        Playlist playlist = playlist(playlistId, null);
        PlaylistExercise first = item(UUID.randomUUID(), 0);
        PlaylistExercise second = item(UUID.randomUUID(), 1);
        ReorderRequest request = new ReorderRequest(List.of(
            new ReorderRequest.ReorderItem(first.getId(), 0),
            new ReorderRequest.ReorderItem(second.getId(), 0)));

        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(playlist));
        when(items.findByPlaylistIdOrderByOrderIndexAsc(playlistId))
            .thenReturn(List.of(first, second));

        assertThrows(ConflictException.class, () -> service.reorder(playlistId, request));
        verify(items, never()).saveAll(any());
    }

    @Test
    @DisplayName("playlists from another user are hidden")
    void shouldHideForeignPlaylist() {
        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.detail(playlistId));
    }

    private Playlist playlist(UUID id, Instant archivedAt) {
        Playlist playlist = new Playlist();
        playlist.setId(id);
        playlist.setUserId(userId);
        playlist.setName("Push");
        playlist.setArchivedAt(archivedAt);
        return playlist;
    }

    private PlaylistExercise item(UUID id, int orderIndex) {
        PlaylistExercise item = new PlaylistExercise();
        item.setId(id);
        item.setOrderIndex(orderIndex);
        item.setTargetSets(3);
        item.setExercise(exercise(false));
        return item;
    }

    private Exercise exercise(boolean archived) {
        Exercise exercise = new Exercise();
        exercise.setId(UUID.randomUUID());
        exercise.setName("Supino");
        exercise.setIsArchived(archived);
        return exercise;
    }

    private PlaylistDto playlistDto() {
        return new PlaylistDto(playlistId, "Push", null, null);
    }

    private PlaylistSummaryDto playlistSummary(UUID id, long exerciseCount, Instant lastPerformedAt) {
        return new PlaylistSummaryDto(id, "Push", null, null, exerciseCount, lastPerformedAt);
    }

    private PlaylistExerciseDto itemDto(UUID id) {
        return new PlaylistExerciseDto(
            id, UUID.randomUUID(), "Supino", 0, 3, 8, 12, 90, null);
    }
}
