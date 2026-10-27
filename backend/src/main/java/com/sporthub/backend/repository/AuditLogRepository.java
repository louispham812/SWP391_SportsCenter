package com.sporthub.backend.repository;

import com.sporthub.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    
    List<AuditLog> findByLogTypeAndCreatedAtAfter(String logType, LocalDateTime after);
    
    List<AuditLog> findByStatusAndCreatedAtAfter(String status, LocalDateTime after);
}
