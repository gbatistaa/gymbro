package com.gbatistadev.gymbro.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
	Optional<RefreshToken> findByUserId(UUID userId);

	@Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user WHERE rt.tokenHash = :hash AND rt.expiresAt > :now")
	Optional<RefreshToken> findValidByTokenHash(@Param("hash") String hash, @Param("now") Instant now);

	void deleteByTokenHash(String tokenHash);

	void deleteByTokenHashAndUserId(String tokenHash, UUID userId);

	void deleteByUserId(UUID userId);
}
