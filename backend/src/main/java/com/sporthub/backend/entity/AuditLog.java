package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    // Fields used by EngagementService / Manager audit logs
    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", columnDefinition = "NVARCHAR(100)")
    private String actorName;

    @Column(name = "actor_role", length = 20)
    private String actorRole;

    @Column(name = "action", length = 60)
    private String action;

    @Column(name = "detail", columnDefinition = "NVARCHAR(1000)")
    private String detail;

    // Fields used by AuditLogService (OTP / Auth logs)
    @Column(name = "log_type", length = 50)
    private String logType;

    @Column(name = "user_email", length = 100)
    private String userEmail;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "action_detail", columnDefinition = "NVARCHAR(MAX)")
    private String actionDetail;

    @Column(length = 20)
    private String status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
