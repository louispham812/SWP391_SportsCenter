package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from Equipment e where e.itemId = :id")
    java.util.Optional<Equipment> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    List<Equipment> findByStatusIgnoreCase(String status);
}
