package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from Voucher v where upper(v.code) = upper(:code)")
    Optional<Voucher> findByCodeForUpdate(@org.springframework.data.repository.query.Param("code") String code);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from Voucher v where v.voucherId = :id")
    Optional<Voucher> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    Optional<Voucher> findByCodeIgnoreCase(String code);
    List<Voucher> findByStatusIgnoreCase(String status);
}
