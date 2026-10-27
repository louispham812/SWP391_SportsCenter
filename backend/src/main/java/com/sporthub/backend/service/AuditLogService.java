package com.sporthub.backend.service;

import com.sporthub.backend.entity.AuditLog;
import com.sporthub.backend.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Ghi audit log thành công
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSuccess(String logType, String userEmail, Long userId, String actionDetail) {
        try {
            AuditLog log = AuditLog.builder()
                    .logType(logType)
                    .userEmail(userEmail)
                    .userId(userId)
                    .actionDetail(actionDetail)
                    .status("SUCCESS")
                    .build();
            
            auditLogRepository.save(log);
            
            logger.info("[AUDIT-LOG] {} | Email: {} | UserId: {} | Status: SUCCESS | Detail: {}", 
                    logType, userEmail, userId, actionDetail);
                    
        } catch (Exception e) {
            logger.error("[AUDIT-LOG] Failed to save success log: {}", e.getMessage());
        }
    }

    /**
     * Ghi audit log thất bại
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(String logType, String userEmail, Long userId, String actionDetail, String errorMessage) {
        try {
            AuditLog log = AuditLog.builder()
                    .logType(logType)
                    .userEmail(userEmail)
                    .userId(userId)
                    .actionDetail(actionDetail)
                    .status("FAILED")
                    .errorMessage(errorMessage)
                    .build();
            
            auditLogRepository.save(log);
            
            logger.warn("[AUDIT-LOG] {} | Email: {} | UserId: {} | Status: FAILED | Detail: {} | Error: {}", 
                    logType, userEmail, userId, actionDetail, errorMessage);
                    
        } catch (Exception e) {
            logger.error("[AUDIT-LOG] Failed to save failure log: {}", e.getMessage());
        }
    }

    /**
     * Ghi audit log với IP và User Agent (cho HTTP requests)
     */
    @Transactional
    public void logWithRequest(String logType, String userEmail, Long userId, 
                               String actionDetail, String status, String errorMessage,
                               String ipAddress, String userAgent) {
        try {
            AuditLog log = AuditLog.builder()
                    .logType(logType)
                    .userEmail(userEmail)
                    .userId(userId)
                    .actionDetail(actionDetail)
                    .status(status)
                    .errorMessage(errorMessage)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            
            auditLogRepository.save(log);
            
            if ("SUCCESS".equals(status)) {
                logger.info("[AUDIT-LOG] {} | Email: {} | IP: {} | Status: SUCCESS | Detail: {}", 
                        logType, userEmail, ipAddress, actionDetail);
            } else {
                logger.warn("[AUDIT-LOG] {} | Email: {} | IP: {} | Status: FAILED | Detail: {} | Error: {}", 
                        logType, userEmail, ipAddress, actionDetail, errorMessage);
            }
                    
        } catch (Exception e) {
            logger.error("[AUDIT-LOG] Failed to save request log: {}", e.getMessage());
        }
    }
}
