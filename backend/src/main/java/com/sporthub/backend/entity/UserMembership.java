package com.sporthub.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    // Quota tracking fields for CLASS/PT bookings (added by migration 001)
    @Column(name = "remaining_quota_sessions")
    private Integer remainingQuotaSessions = 0;

    @Column(name = "held_quota_sessions")
    private Integer heldQuotaSessions = 0;

    @Column(name = "used_quota_sessions")
    private Integer usedQuotaSessions = 0;

    @Column(name = "initial_quota_sessions")
    private Integer initialQuotaSessions = 0;

    // Quota tracking fields for COURT bookings (added by migration 002)
    @Column(name = "remaining_quota_courts")
    private Integer remainingQuotaCourts = 0;

    @Column(name = "held_quota_courts")
    private Integer heldQuotaCourts = 0;

    @Column(name = "used_quota_courts")
    private Integer usedQuotaCourts = 0;

    @Column(name = "initial_quota_courts")
    private Integer initialQuotaCourts = 0;
}
