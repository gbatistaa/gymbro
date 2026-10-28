package com.gbatistadev.gymbro.exercise;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Exercise test class")
class ExerciseServiceTest {

    @Mock
    private ExerciseRepository repository;

    @Mock
    private ExerciseMapper mapper;

    @InjectMocks
    private ExerciseService service;

    @Test
    void shouldCreateExercise_whenMethodIsCalled() {
    }

    @Test
    void findAll() {
    }

    @Test
    void updateExercise() {
    }
}