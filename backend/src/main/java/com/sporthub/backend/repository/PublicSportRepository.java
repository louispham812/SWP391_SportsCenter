package com.sporthub.backend.repository;

import com.sporthub.backend.entity.PublicSport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicSportRepository extends JpaRepository<PublicSport, Long> {
    List<PublicSport> findByActiveTrueOrderBySportIdAsc();
}
