package com.gbatistadev.gymbro.exercise;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID>, JpaSpecificationExecutor<Exercise> {

	@Query("""
		SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
		FROM Exercise e
		WHERE LOWER(e.name) = LOWER(:name)
	""")
	Boolean existsExerciseNameDuplicate(@Param("name") String name);
}