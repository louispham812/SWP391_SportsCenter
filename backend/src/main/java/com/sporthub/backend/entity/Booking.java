package com.sporthub.backend.entity;

import com.sporthub.backend.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Builder.Default
    @Column(name = "booking_time")
    private LocalDateTime bookingTime = LocalDateTime.now();

    @Builder.Default
    @Column(length = 20)
    private String status = "BOOKED"; // BOOKED, WAITLIST, CANCELLED

    // Changed to enum (migration 003 expanded values)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", length = 30)
    private AttendanceStatus attendanceStatus = AttendanceStatus.PENDING;

    @Column(name = "coach_note", columnDefinition = "NVARCHAR(MAX)")
    private String coachNote;

    @Column(name = "fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "payment_id")
    private Long paymentId;

    // Quota tracking fields (added by migration 003)
    @Builder.Default
    @Column(name = "uses_membership_quota")
    private Boolean usesMembershipQuota = false;

    @Column(name = "membership_id")
    private Long membershipId;
}