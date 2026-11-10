package com.sporthub.backend.repository;
import com.sporthub.backend.entity.GatewayReceipt;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface GatewayReceiptRepository extends JpaRepository<GatewayReceipt, Long> {
    Optional<GatewayReceipt> findByGatewayTransactionNo(String transactionNo);
    List<GatewayReceipt> findByStatusInOrderByCreatedAtDesc(List<String> statuses);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from GatewayReceipt r where r.receiptId = :id")
    Optional<GatewayReceipt> findByIdForUpdate(@Param("id") Long id);
}
