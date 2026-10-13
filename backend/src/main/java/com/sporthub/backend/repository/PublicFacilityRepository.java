package com.sporthub.backend.repository;

import com.sporthub.backend.entity.PublicFacility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicFacilityRepository extends JpaRepository<PublicFacility, Long> {
    List<PublicFacility> findByActiveTrueOrderByFacilityIdAsc();
}
