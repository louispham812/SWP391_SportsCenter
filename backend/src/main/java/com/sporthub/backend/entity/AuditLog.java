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

    @PrePersist
    @PreUpdate
    public void syncAuditFields() {
        if ((this.action == null || this.action.isBlank()) && this.logType != null) {
            this.action = this.logType;
        }
        if ((this.logType == null || this.logType.isBlank()) && this.action != null) {
            this.logType = this.action;
        }
        if ((this.detail == null || this.detail.isBlank()) && this.actionDetail != null) {
            this.detail = this.actionDetail.length() > 1000 ? this.actionDetail.substring(0, 1000) : this.actionDetail;
        }
        if ((this.actionDetail == null || this.actionDetail.isBlank()) && this.detail != null) {
            this.actionDetail = this.detail;
        }
        if (this.actorId == null && this.userId != null) {
            this.actorId = this.userId;
        }
        if (this.userId == null && this.actorId != null) {
            this.userId = this.actorId;
        }
        if ((this.actorName == null || this.actorName.isBlank()) && this.userEmail != null) {
            this.actorName = this.userEmail;
        }
        if ((this.userEmail == null || this.userEmail.isBlank()) && this.actorName != null) {
            this.userEmail = this.actorName;
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public String getAction() {
        return (this.action != null && !this.action.isBlank()) ? this.action : this.logType;
    }

    public String getDetail() {
        return (this.detail != null && !this.detail.isBlank()) ? this.detail : this.actionDetail;
    }

    public Long getActorId() {
        return this.actorId != null ? this.actorId : this.userId;
    }

    public String getActorName() {
        return (this.actorName != null && !this.actorName.isBlank()) ? this.actorName : this.userEmail;
    }
}
