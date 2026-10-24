package com.sporthub.backend.repository;

import com.sporthub.backend.entity.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    List<WorkoutPlan> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<WorkoutPlan> findByCoachIdOrderByCreatedAtDesc(Long coachId);
}
