package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(nullable = false, length = 50)
    private String category; // ATTENDANCE_DISPUTE, COACH_DISPUTE, FACILITY_ISSUE, PAYMENT_ISSUE, OTHER

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String severity = "NORMAL"; // NORMAL, URGENT

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "SUBMITTED"; // SUBMITTED, IN_REVIEW, RESOLVED, REJECTED

    @Column(name = "admin_response", columnDefinition = "NVARCHAR(MAX)")
    private String adminResponse;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
