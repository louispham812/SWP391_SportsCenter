package com.sporthub.backend.repository;

import com.sporthub.backend.entity.CoachLeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachLeaveRequestRepository extends JpaRepository<CoachLeaveRequest, Long> {
    List<CoachLeaveRequest> findByCoachIdOrderByCreatedAtDesc(Long coachId);
    List<CoachLeaveRequest> findAllByOrderByCreatedAtDesc();
}
