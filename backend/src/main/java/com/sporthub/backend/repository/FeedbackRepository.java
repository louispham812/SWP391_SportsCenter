package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCoachIdOrderByCreatedAtDesc(Long coachId);
    List<Feedback> findBySessionId(Long sessionId);
}
