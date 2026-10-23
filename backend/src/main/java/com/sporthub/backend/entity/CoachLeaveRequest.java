package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coach_leave_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachLeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Column(name = "coach_name", length = 100)
    private String coachName;

    @Column(name = "leave_type", nullable = false, length = 50)
    private String leaveType; // SICK_LEAVE, PERSONAL_LEAVE, SCHEDULE_CHANGE

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "approved_by")
    private Long approvedBy;

    @Builder.Default
    @Column(name = "affected_bookings_count", nullable = false)
    private Integer affectedBookingsCount = 0;

    @Column(name = "reassigned_coach_id")
    private Long reassignedCoachId;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
