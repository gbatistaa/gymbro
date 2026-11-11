package com.gbatistadev.gymbro.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
	boolean existsByEmail(String email);

	Optional<User> findByEmail(String email);

	boolean existsByUsernameIgnoreCase(String username);

	@Query("SELECT u.id AS id, u.name AS name, u.email AS email, u.username AS username, u.createdAt AS createdAt, u.timezone AS timezone FROM User u WHERE u.id = :id")
	Optional<UserSummaryProjection> findSummaryById(@Param("id") UUID id);
}
