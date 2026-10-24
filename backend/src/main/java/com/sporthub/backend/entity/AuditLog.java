package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", columnDefinition = "NVARCHAR(100)")
    private String actorName;

    @Column(name = "actor_role", length = 20)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 60)
    private String action;

    @Column(name = "detail", columnDefinition = "NVARCHAR(1000)")
    private String detail;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
