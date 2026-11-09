package com.sporthub.backend.repository;

import com.sporthub.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface CourtMaintenanceRepository extends JpaRepository<CourtMaintenance, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from CourtMaintenance m where m.maintenanceId = :id")
    java.util.Optional<CourtMaintenance> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    List<CourtMaintenance> findAllByOrderByStartTimeDesc();
    List<CourtMaintenance> findByCourtId(Long courtId);
    List<CourtMaintenance> findByCourtIdAndEndTimeAfter(Long courtId, LocalDateTime now);
    List<CourtMaintenance> findByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long courtId, LocalDateTime end, LocalDateTime start);
    boolean existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long courtId, LocalDateTime end, LocalDateTime start);

    @Query("""
            select count(m) > 0
            from CourtMaintenance m
            where m.courtId = :courtId
              and m.startTime <= :time
              and m.endTime >= :time
            """)
    boolean existsByCourtIdAndActiveAtTime(@Param("courtId") Long courtId, @Param("time") LocalDateTime time);

    void deleteByCourtId(Long courtId);
}
