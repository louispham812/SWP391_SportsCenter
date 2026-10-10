package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 15)
    private String phone;

    @Column(length = 255)
    private String avatar;

    @Column(nullable = false, length = 20)
    private String role; // MANAGER, RECEPTIONIST, COACH, MEMBER

    @Builder.Default
    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, LOCKED

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}