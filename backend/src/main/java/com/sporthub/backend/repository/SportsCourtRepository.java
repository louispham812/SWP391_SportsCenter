package com.sporthub.backend.repository;

import com.sporthub.backend.entity.SportsCourt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SportsCourtRepository extends JpaRepository<SportsCourt, Long> {
    List<SportsCourt> findBySportIdAndActiveTrueOrderByCourtIdAsc(Long sportId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select court from SportsCourt court where court.courtId = :courtId")
    Optional<SportsCourt> findByIdForUpdate(@Param("courtId") Long courtId);
}
