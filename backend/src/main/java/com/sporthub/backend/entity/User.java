package com.sporthub.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

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

    @Column(name = "rfid_code", length = 64)
    private String rfidCode;

    @Column(name = "specialty", length = 200)
    private String specialty;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "certifications", length = 500)
    private String certifications;

    @Column(name = "bio", columnDefinition = "NVARCHAR(MAX)")
    private String bio;

    @Column(name = "availability_json", columnDefinition = "NVARCHAR(MAX)")
    private String availabilityJson;

    @JsonIgnore
    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "coach_sports",
            joinColumns = @JoinColumn(name = "coach_id"),
            inverseJoinColumns = @JoinColumn(name = "sport_id")
    )
    private Set<Sport> coachedSports = new LinkedHashSet<>();

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
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, LOCKED

    @Builder.Default
    @Column(name = "require_password_change", nullable = false)
    private Boolean requirePasswordChange = false;
    
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return userId != null && Objects.equals(userId, other.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}