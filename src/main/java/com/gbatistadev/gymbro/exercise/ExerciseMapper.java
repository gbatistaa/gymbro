package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExerciseMapper {
    ExerciseDto toDto(Exercise exercise);

    @Mapping(target = "id", ignore = true)
    Exercise toEntity(CreateExerciseDto exerciseDto);
}
