package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Exercise ownership isolation")
class ExerciseOwnershipIT {

    private static final String UPDATE_BODY =
        "{\"name\":\"Renamed\",\"primaryMuscle\":\"chest\",\"secondaryMuscle\":\"triceps\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExerciseRepository repository;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("a user lists global exercises and only their own custom ones")
    void shouldListOnlyOwnAndGlobalExercises() throws Exception {
        UserDto userA = createUser("a");
        UserDto userB = createUser("b");
        Exercise global = createExercise(null, "Global");
        Exercise mine = createExercise(userA.getId(), "Mine");
        Exercise foreign = createExercise(userB.getId(), "Foreign");

        mockMvc.perform(get("/api/exercises").cookie(accessCookie(userA)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", hasItem(global.getId().toString())))
            .andExpect(jsonPath("$[*].id", hasItem(mine.getId().toString())))
            .andExpect(jsonPath("$[*].id", not(hasItem(foreign.getId().toString()))));
    }

    @Test
    @DisplayName("a user cannot edit another user's custom exercise (404)")
    void shouldHideForeignExerciseOnUpdate() throws Exception {
        UserDto userA = createUser("a");
        UserDto userB = createUser("b");
        Exercise foreign = createExercise(userB.getId(), "Foreign");

        mockMvc.perform(put("/api/exercises/{id}", foreign.getId())
                .cookie(accessCookie(userA))
                .contentType(MediaType.APPLICATION_JSON)
                .content(UPDATE_BODY))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("global catalog exercises are read-only (403)")
    void shouldRejectGlobalExerciseUpdate() throws Exception {
        UserDto userA = createUser("a");
        Exercise global = createExercise(null, "Global");

        mockMvc.perform(put("/api/exercises/{id}", global.getId())
                .cookie(accessCookie(userA))
                .contentType(MediaType.APPLICATION_JSON)
                .content(UPDATE_BODY))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a user can edit their own custom exercise")
    void shouldUpdateOwnExercise() throws Exception {
        UserDto userA = createUser("a");
        Exercise mine = createExercise(userA.getId(), "Mine");

        mockMvc.perform(put("/api/exercises/{id}", mine.getId())
                .cookie(accessCookie(userA))
                .contentType(MediaType.APPLICATION_JSON)
                .content(UPDATE_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Renamed"));
    }

    private UserDto createUser(String prefix) {
        return userService.create(new CreateUserDto(
            "User " + prefix,
            "user-" + prefix + "-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }

    private Exercise createExercise(UUID userId, String prefix) {
        Exercise exercise = new Exercise();
        exercise.setUserId(userId);
        exercise.setName(prefix + "-" + UUID.randomUUID());
        exercise.setPrimaryMuscle("chest");
        exercise.setSecondaryMuscle("triceps");
        return repository.save(exercise);
    }

    private Cookie accessCookie(UserDto user) {
        return new Cookie("access_token", jwtService.createAccessToken(user.getId(), user.getEmail()));
    }
}
