package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Pinned exercises on the progress dashboard")
class PinnedExercisesIT {

    private static final String URL = "/api/progress/pinned-exercises";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exercises;

    @Test
    @DisplayName("starts empty")
    void shouldStartEmpty() throws Exception {
        mockMvc.perform(get(URL).header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("replaces the pinned list, keeping the requested order")
    void shouldReplacePinnedList() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise squat = createExercise(user.getId(), "Squat", "Quadriceps");
        Exercise bench = createExercise(user.getId(), "Bench press", "Chest");
        Exercise row = createExercise(user.getId(), "Row", "Back");

        replace(auth, List.of(squat.getId(), bench.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].exerciseId").value(squat.getId().toString()))
            .andExpect(jsonPath("$[0].name").value("Squat"))
            .andExpect(jsonPath("$[0].primaryMuscle").value("Quadriceps"))
            .andExpect(jsonPath("$[0].position").value(0))
            .andExpect(jsonPath("$[1].exerciseId").value(bench.getId().toString()));

        replace(auth, List.of(row.getId(), squat.getId()))
            .andExpect(status().isOk());

        mockMvc.perform(get(URL).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].exerciseId").value(row.getId().toString()))
            .andExpect(jsonPath("$[1].exerciseId").value(squat.getId().toString()))
            .andExpect(jsonPath("$[1].position").value(1));
    }

    @Test
    @DisplayName("an empty list unpins everything")
    void shouldClearPinnedList() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        replace(auth, List.of(createExercise(user.getId(), "Squat", "Quadriceps").getId()))
            .andExpect(status().isOk());

        replace(auth, List.of()).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get(URL).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("accepts at most four exercises")
    void shouldRejectMoreThanFour() throws Exception {
        UserDto user = createUser();
        List<UUID> five = List.of(
            createExercise(user.getId(), "A", "Chest").getId(),
            createExercise(user.getId(), "B", "Chest").getId(),
            createExercise(user.getId(), "C", "Chest").getId(),
            createExercise(user.getId(), "D", "Chest").getId(),
            createExercise(user.getId(), "E", "Chest").getId());

        replace(bearer(user), five)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("rejects the same exercise twice")
    void shouldRejectDuplicates() throws Exception {
        UserDto user = createUser();
        UUID squat = createExercise(user.getId(), "Squat", "Quadriceps").getId();

        replace(bearer(user), List.of(squat, squat))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("DUPLICATE_EXERCISE"));
    }

    @Test
    @DisplayName("cannot pin another user's exercise, and a failed request keeps the current list")
    void shouldRejectForeignExercise() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        UUID own = createExercise(user.getId(), "Squat", "Quadriceps").getId();
        UUID foreign = createExercise(createUser().getId(), "Secret", "Chest").getId();
        replace(auth, List.of(own)).andExpect(status().isOk());

        replace(auth, List.of(foreign)).andExpect(status().isNotFound());

        mockMvc.perform(get(URL).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].exerciseId").value(own.toString()));
    }

    @Test
    @DisplayName("each user has their own pinned list")
    void shouldIsolateUsers() throws Exception {
        UserDto owner = createUser();
        replace(bearer(owner), List.of(createExercise(owner.getId(), "Squat", "Quadriceps").getId()))
            .andExpect(status().isOk());

        mockMvc.perform(get(URL).header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    private ResultActions replace(String auth, List<UUID> exerciseIds) throws Exception {
        String ids = exerciseIds.stream()
            .map(id -> "\"" + id + "\"")
            .collect(Collectors.joining(","));

        return mockMvc.perform(put(URL)
            .header(HttpHeaders.AUTHORIZATION, auth)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"exerciseIds\":[" + ids + "]}"));
    }

    private Exercise createExercise(UUID userId, String name, String primaryMuscle) {
        Exercise exercise = new Exercise();
        exercise.setName(name);
        exercise.setPrimaryMuscle(primaryMuscle);
        exercise.setUserId(userId);
        return exercises.save(exercise);
    }

    private String bearer(UserDto user) {
        return "Bearer " + jwtService.createAccessToken(user.getId(), user.getEmail());
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
            "u" + UUID.randomUUID().toString().substring(0, 8),
            "user-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }
}
