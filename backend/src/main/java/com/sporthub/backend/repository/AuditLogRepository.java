package com.sporthub.backend.repository;

import com.sporthub.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query(value = "SELECT TOP 200 * FROM audit_logs ORDER BY created_at DESC", nativeQuery = true)
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
}
