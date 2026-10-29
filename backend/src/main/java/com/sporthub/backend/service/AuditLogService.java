package com.sporthub.backend.service;

import com.sporthub.backend.entity.AuditLog;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuditLogRepository;
import com.sporthub.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    private String resolveActorName(Long userId, String userEmail) {
        if (userId != null) {
            try {
                return userRepository.findById(userId).map(User::getFullName).orElse(userEmail);
            } catch (Exception ignored) {
            }
        }
        return userEmail != null ? userEmail : "SYSTEM";
    }

    private String resolveActorRole(Long userId) {
        if (userId != null) {
            try {
                return userRepository.findById(userId).map(User::getRole).orElse(null);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    /**
     * Ghi audit log thành công
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.READ_UNCOMMITTED)
    public void logSuccess(String logType, String userEmail, Long userId, String actionDetail) {
        try {
            String actorName = resolveActorName(userId, userEmail);
            String actorRole = resolveActorRole(userId);
            AuditLog log = AuditLog.builder()
                    .actorId(userId)
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(logType)
                    .detail(actionDetail != null && actionDetail.length() > 1000 ? actionDetail.substring(0, 1000) : actionDetail)
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
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.READ_UNCOMMITTED)
    public void logFailure(String logType, String userEmail, Long userId, String actionDetail, String errorMessage) {
        try {
            String actorName = resolveActorName(userId, userEmail);
            String actorRole = resolveActorRole(userId);
            String fullDetail = (actionDetail != null ? actionDetail : "") + (errorMessage != null ? " | Lỗi: " + errorMessage : "");
            AuditLog log = AuditLog.builder()
                    .actorId(userId)
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(logType)
                    .detail(fullDetail.length() > 1000 ? fullDetail.substring(0, 1000) : fullDetail)
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
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.READ_UNCOMMITTED)
    public void logWithRequest(String logType, String userEmail, Long userId, 
                               String actionDetail, String status, String errorMessage,
                               String ipAddress, String userAgent) {
        try {
            String actorName = resolveActorName(userId, userEmail);
            String actorRole = resolveActorRole(userId);
            String fullDetail = (actionDetail != null ? actionDetail : "") + (errorMessage != null ? " | Lỗi: " + errorMessage : "");
            AuditLog log = AuditLog.builder()
                    .actorId(userId)
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(logType)
                    .detail(fullDetail.length() > 1000 ? fullDetail.substring(0, 1000) : fullDetail)
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