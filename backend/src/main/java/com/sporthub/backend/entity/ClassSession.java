package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "class_name", nullable = false, length = 100)
    private String className;

    @Column(name = "sport_id", nullable = false)
    private Long sportId;

    @Column(name = "coach_id", nullable = false)
    private Long coachId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "max_slots", nullable = false)
    private Integer maxSlots;

    @Builder.Default
    @Column(name = "booked_slots")
    private Integer bookedSlots = 0;

    @Builder.Default
    @Column(length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "price_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAmount;

    @Column(name = "booked_slots")
    private Integer bookedSlots = 0;

    @Column(length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
}