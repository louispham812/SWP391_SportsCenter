package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_check_ins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "check_in_id")
    private Long checkInId;

    @Column(name = "member_id", nullable = false)
    private Long memberId; 

    @Column(name = "checked_in_at", nullable = false)
    private LocalDateTime checkedInAt;

    @Column(name = "result", nullable = false, length = 20)
    private String result; // 'VALID' hoặc 'REJECTED'

    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy; 
}