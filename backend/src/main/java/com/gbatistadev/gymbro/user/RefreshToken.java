package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "refresh_tokens")
public class RefreshToken extends BaseEntity {
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    @JdbcTypeCode(SqlTypes.TIMESTAMP_WITH_TIMEZONE)
    private Instant expiresAt;

    // shortcut: 1 refresh ativo por usuário (uk_refresh_tokens_user); upgrade = 1 linha por sessão
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}
