package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    List<Facility> findBySportIdAndStatus(Long sportId, String status);

    List<Facility> findByStatus(String status);

    List<Facility> findAllByOrderByFacilityIdAsc();
}
