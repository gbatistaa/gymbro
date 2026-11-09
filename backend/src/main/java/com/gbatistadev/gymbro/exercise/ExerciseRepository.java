package com.gbatistadev.gymbro.exercise;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID>, JpaSpecificationExecutor<Exercise> {

	@Query("""
		SELECT e FROM Exercise e
		WHERE e.id = :id AND (e.userId IS NULL OR e.userId = :userId)
	""")
	Optional<Exercise> findByIdForUser(@Param("id") UUID id, @Param("userId") UUID userId);

	@Query("""
		SELECT e FROM Exercise e
		WHERE e.userId IS NULL OR e.userId = :userId
		ORDER BY e.name
	""")
	List<Exercise> findAllForUser(@Param("userId") UUID userId);

	@Query("""
		SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
		FROM Exercise e
		WHERE (e.userId IS NULL OR e.userId = :userId)
		  AND LOWER(TRIM(e.name)) = LOWER(TRIM(:name))
	""")
	boolean existsExerciseNameDuplicate(@Param("name") String name, @Param("userId") UUID userId);
}
