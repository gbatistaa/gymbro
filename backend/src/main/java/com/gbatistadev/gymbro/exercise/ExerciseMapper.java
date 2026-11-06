package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import org.mapstruct.Condition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ExerciseMapper {
    ExerciseDto toDto(Exercise exercise);

    @Mapping(target = "id", ignore = true)
    Exercise toEntity(CreateExerciseDto exerciseDto);

    @Mapping(target = "id", ignore = true)
    void updateEntity(UpdateExerciseDto dto, @MappingTarget Exercise entity);
}
