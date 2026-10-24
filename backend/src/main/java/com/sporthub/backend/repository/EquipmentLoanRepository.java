package com.sporthub.backend.repository;

import com.sporthub.backend.entity.EquipmentLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentLoanRepository extends JpaRepository<EquipmentLoan, Long> {
    List<EquipmentLoan> findAllByOrderByLoanedAtDesc();
    List<EquipmentLoan> findByStatusIgnoreCaseOrderByLoanedAtDesc(String status);
}
