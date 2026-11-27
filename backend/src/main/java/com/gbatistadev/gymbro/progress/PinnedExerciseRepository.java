package com.gbatistadev.gymbro.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PinnedExerciseRepository extends JpaRepository<PinnedExercise, UUID> {

    @Query("""
        SELECT p FROM PinnedExercise p
        JOIN FETCH p.exercise
        WHERE p.userId = :userId
        ORDER BY p.position
    """)
    List<PinnedExercise> findDetailByUserId(@Param("userId") UUID userId);

    /**
     * Apaga na hora, sem esperar o flush: o Hibernate faria os INSERTs antes dos DELETEs e a nova
     * lista colidiria com a antiga nas chaves únicas de posição e de exercício.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM PinnedExercise p WHERE p.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
