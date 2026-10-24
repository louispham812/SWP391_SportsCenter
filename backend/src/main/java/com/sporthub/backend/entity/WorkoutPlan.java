package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "workout_plans")
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "coach_id")
    private Long coachId;

    @Column(name = "coach_name", columnDefinition = "NVARCHAR(100)")
    private String coachName;

    @Column(name = "title", nullable = false, columnDefinition = "NVARCHAR(200)")
    private String title;

    @Column(name = "goal", columnDefinition = "NVARCHAR(300)")
    private String goal;

    @Column(name = "exercises_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String exercisesJson;

    @Column(name = "session_result", columnDefinition = "NVARCHAR(MAX)")
    private String sessionResult;

    @Column(name = "coach_feedback", columnDefinition = "NVARCHAR(MAX)")
    private String coachFeedback;

    @Column(name = "homework", columnDefinition = "NVARCHAR(MAX)")
    private String homework;

    @Column(name = "source", length = 20, nullable = false)
    @Builder.Default
    private String source = "COACH";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
