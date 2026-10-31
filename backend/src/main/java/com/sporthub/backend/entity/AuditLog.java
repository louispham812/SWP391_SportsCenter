
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

    @Column(name = "log_type", length = 50)
    private String logType;

    @Column(name = "detail", columnDefinition = "NVARCHAR(1000)")
    private String detail;

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

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void syncAuditFields() {
        if (action == null || action.isBlank()) {
            action = logType;
        }
        if (logType == null || logType.isBlank()) {
            logType = action;
        }

        if (detail == null || detail.isBlank()) {
            if (actionDetail != null) {
                detail = actionDetail.length() > 1000
                        ? actionDetail.substring(0, 1000)
                        : actionDetail;
            }
        }
        if (actionDetail == null || actionDetail.isBlank()) {
            actionDetail = detail;
        }

        if (actorId == null) {
            actorId = userId;
        }
        if (userId == null) {
            userId = actorId;
        }

        if (actorName == null || actorName.isBlank()) {
            actorName = userEmail;
        }
        if (userEmail == null || userEmail.isBlank()) {
            userEmail = actorName;
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
