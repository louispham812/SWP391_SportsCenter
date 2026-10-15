package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Integer> {
    List<Facility> findByStatus(String status);
    List<Facility> findBySportIdAndStatus(Integer sportId, String status);
}