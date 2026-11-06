package com.gbatistadev.gymbro.user;

import java.time.Instant;
import java.util.UUID;

/**
 * Summary projection of {@link User} (no password hash).
 */
public interface UserSummaryProjection {
    UUID getId();
    String getName();
    String getEmail();
    Instant getCreatedAt();
}
