package com.gbatistadev.gymbro.bioimpedance_logs;

import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance_logs.enums.ActionType;
import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "bioimpedance_log")
public class BioimpedanceLog extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "old_data", nullable = true)
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode oldData;

    @Column(name = "new_data", nullable = true)
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode newData;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bioimpedance_id", nullable = false)
    private Bioimpedance bioimpedance;
}