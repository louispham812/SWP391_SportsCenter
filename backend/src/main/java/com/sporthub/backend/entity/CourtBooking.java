package com.sporthub.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
@Table(name = "court_bookings")
@Getter
@Setter
@NoArgsConstructor
public class CourtBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "court_booking_id")
    private Long courtBookingId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "court_id", nullable = false)
    private Long courtId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Quota booking fields (added by migration 002)
    @Column(name = "uses_membership_quota")
    private Boolean usesMembershipQuota = false;

    @Column(name = "membership_id")
    private Long membershipId;

    @Column(name = "quota_hours_used", precision = 4, scale = 2)
    private BigDecimal quotaHoursUsed = BigDecimal.ZERO;
    @Column(name = "quota_state", length = 24)
    private String quotaState; // HELD, USED, RELEASED, FORFEITED; NULL legacy state must be established first.

}
