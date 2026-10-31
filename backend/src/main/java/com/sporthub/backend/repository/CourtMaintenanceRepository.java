package com.sporthub.backend.repository;

import com.sporthub.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CourtMaintenanceRepository extends JpaRepository<CourtMaintenance, Long> {
    List<CourtMaintenance> findAllByOrderByStartTimeDesc();
    List<CourtMaintenance> findByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long courtId, LocalDateTime end, LocalDateTime start);
    boolean existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long courtId, LocalDateTime end, LocalDateTime start);
}
