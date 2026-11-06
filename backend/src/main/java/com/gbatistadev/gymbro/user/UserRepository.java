package com.gbatistadev.gymbro.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
	boolean existsByEmail(String email);

	Optional<User> findByEmail(String email);

	@Query("SELECT u.id AS id, u.name AS name, u.email AS email, u.createdAt AS createdAt FROM User u WHERE u.id = :id")
	Optional<UserSummaryProjection> findSummaryById(@Param("id") UUID id);
}
