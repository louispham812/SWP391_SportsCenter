package com.sporthub.backend.repository;

import com.sporthub.backend.entity.PublicFacility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicFacilityRepository extends JpaRepository<PublicFacility, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select f from PublicFacility f where f.facilityId = :id")
    java.util.Optional<PublicFacility> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    List<PublicFacility> findByActiveTrueOrderByFacilityIdAsc();
    List<PublicFacility> findAllByOrderByFacilityIdAsc();
}
