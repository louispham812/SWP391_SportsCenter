package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
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

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password", nullable = false, length = 100)
    private String passwordHash;

    @Column(length = 15)
    private String phone;

    @Column(name = "avatar", columnDefinition = "NVARCHAR(MAX)")
    private String avatar;

    @Column(length = 20)
    private String gender;

    @Column(columnDefinition = "NVARCHAR(500)")
    private String address;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 15)
    private String emergencyContactPhone;

    @Column(nullable = false, length = 20)
    private String role; // MANAGER, RECEPTIONIST, COACH, MEMBER

    @Builder.Default
    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, LOCKED, PENDING

    @Builder.Default
    @Column(name = "require_password_change", nullable = false)
    private Boolean requirePasswordChange = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
