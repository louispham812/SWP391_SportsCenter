package com.sporthub.backend.repository;

import com.sporthub.backend.entity.CoachLeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachLeaveRequestRepository extends JpaRepository<CoachLeaveRequest, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select l from CoachLeaveRequest l where l.requestId = :id")
    java.util.Optional<CoachLeaveRequest> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    List<CoachLeaveRequest> findByCoachIdOrderByCreatedAtDesc(Long coachId);
    List<CoachLeaveRequest> findAllByOrderByCreatedAtDesc();
}
