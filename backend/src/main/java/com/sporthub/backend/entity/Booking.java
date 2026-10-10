package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(name = "booking_time")
    private LocalDateTime bookingTime = LocalDateTime.now();

    @Column(length = 20)
    private String status = "BOOKED"; // BOOKED, WAITLIST, CANCELLED

    @Column(name = "attendance_status", length = 20)
    private String attendanceStatus = "PENDING"; // PENDING, PRESENT, ABSENT

    @Column(name = "coach_note", columnDefinition = "NVARCHAR(MAX)")
    private String coachNote;
}