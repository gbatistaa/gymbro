package com.gbatistadev.gymbro.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
	List<RefreshToken> findAllByUserId(UUID userId);

	@Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user WHERE rt.tokenHash = :hash AND rt.expiresAt > :now")
	Optional<RefreshToken> findValidByTokenHash(@Param("hash") String hash, @Param("now") Instant now);

	@Modifying
	@Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.expiresAt <= :now")
	int deleteExpiredByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

	void deleteByTokenHash(String tokenHash);

	void deleteByTokenHashAndUserId(String tokenHash, UUID userId);

	void deleteByUserId(UUID userId);
}
