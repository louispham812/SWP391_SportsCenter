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
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false, columnDefinition = "NVARCHAR(200)")
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "type", length = 30)
    private String type;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
