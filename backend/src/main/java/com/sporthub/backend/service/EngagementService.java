package com.sporthub.backend.service;

import com.sporthub.backend.entity.AuditLog;
import com.sporthub.backend.entity.Notification;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuditLogRepository;
import com.sporthub.backend.repository.NotificationRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * Ghi thông báo in-app (MEM-25, COA-16, MGR-20) và nhật ký hệ thống (MGR-14).
 * Mọi lỗi ghi log/thông báo đều được nuốt để không làm hỏng nghiệp vụ chính.
 */
@Service
public class EngagementService {

    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public EngagementService(
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyUser(Long userId, String title, String message, String type) {
        if (userId == null) {
            return;
        }
        try {
            notificationRepository.save(Notification.builder()
                    .userId(userId)
                    .title(title)
                    .message(message)
                    .type(type)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (RuntimeException ignored) {
            // Thông báo là phụ trợ, không chặn nghiệp vụ chính.
        }
    }

    /** Gửi cho toàn bộ người dùng ACTIVE thuộc nhóm audience (ALL, MEMBER, COACH, RECEPTIONIST). */
    public int broadcast(String audience, String title, String message) {
        String target = audience == null ? "ALL" : audience.trim().toUpperCase(Locale.ROOT);
        List<User> recipients = userRepository.findAll().stream()
                .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .filter(u -> !"MANAGER".equalsIgnoreCase(u.getRole()) && !"ADMIN".equalsIgnoreCase(u.getRole()))
                .filter(u -> "ALL".equals(target) || target.equalsIgnoreCase(u.getRole()))
                .toList();
        recipients.forEach(u -> notifyUser(u.getUserId(), title, message, "BROADCAST"));
        return recipients.size();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void audit(Long actorId, String actorRole, String action, String detail) {
        try {
            String name = actorId == null ? null
                    : userRepository.findById(actorId).map(User::getFullName).orElse(null);
            auditLogRepository.save(AuditLog.builder()
                    .actorId(actorId)
                    .actorName(name)
                    .actorRole(actorRole)
                    .action(action)
                    .detail(detail != null && detail.length() > 1000 ? detail.substring(0, 1000) : detail)
                    .logType(action)
                    .userId(actorId)
                    .actionDetail(detail)
                    .status("SUCCESS")
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (RuntimeException ignored) {
            // Nhật ký không được làm hỏng nghiệp vụ chính.
        }
    }
}
