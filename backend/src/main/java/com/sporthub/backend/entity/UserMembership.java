package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "user_memberships")
@Getter
@Setter
@NoArgsConstructor
public class UserMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "um_id")
    private Long membershipId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 20)
    private String status;

    // Quota tracking fields (added by migration 001)
    @Column(name = "remaining_quota_sessions")
    private Integer remainingQuotaSessions = 0;

    @Column(name = "held_quota_sessions")
    private Integer heldQuotaSessions = 0;

    @Column(name = "used_quota_sessions")
    private Integer usedQuotaSessions = 0;

    @Column(name = "initial_quota_sessions")
    private Integer initialQuotaSessions = 0;
}
