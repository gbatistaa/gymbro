package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ExerciseMapper {
    ExerciseDto toDto(Exercise exercise);

    Exercise toEntity(CreateExerciseDto exerciseDto);
}
