package com.sporthub.backend.repository;

import com.sporthub.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = "SELECT TOP 200 * FROM audit_logs ORDER BY created_at DESC", nativeQuery = true)
    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
    
    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    
    List<AuditLog> findByLogTypeAndCreatedAtAfter(String logType, LocalDateTime after);
    
    List<AuditLog> findByStatusAndCreatedAtAfter(String status, LocalDateTime after);
}
