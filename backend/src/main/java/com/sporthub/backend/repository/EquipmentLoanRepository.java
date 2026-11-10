package com.sporthub.backend.repository;

import com.sporthub.backend.entity.EquipmentLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EquipmentLoanRepository extends JpaRepository<EquipmentLoan, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select e from EquipmentLoan e where e.loanId = :id")
    java.util.Optional<EquipmentLoan> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    List<EquipmentLoan> findAllByOrderByLoanedAtDesc();
    List<EquipmentLoan> findByStatusIgnoreCaseOrderByLoanedAtDesc(String status);
    List<EquipmentLoan> findByStatusIgnoreCaseAndLoanedAtBefore(String status, LocalDateTime before);
}

