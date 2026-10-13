package com.sporthub.backend.controller;

import com.sporthub.backend.dto.PendingStaffRegistrationResponse;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/manager/staff-registrations")
@CrossOrigin(origins = "*")
public class ManagerController {

    private static final List<String> STAFF_ROLES = List.of("COACH", "RECEPTIONIST");
    private final UserRepository userRepository;

    public ManagerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PendingStaffRegistrationResponse> getPendingRegistrations(Authentication authentication) {
        requireManager(authentication);
        return userRepository.findPendingStaffRegistrations(STAFF_ROLES)
                .stream()
                .map(user -> new PendingStaffRegistrationResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getCreatedAt()))
                .toList();
    }

    @PatchMapping("/{userId}/approve")
    @Transactional
    public PendingStaffRegistrationResponse approveRegistration(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        return decide(userId, "ACTIVE");
    }

    @PatchMapping("/{userId}/reject")
    @Transactional
    public PendingStaffRegistrationResponse rejectRegistration(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        return decide(userId, "INACTIVE");
    }

    private PendingStaffRegistrationResponse decide(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký nhân viên."));
        if (!"PENDING".equalsIgnoreCase(user.getStatus())
                || !STAFF_ROLES.contains(user.getRole().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Đăng ký này đã được xử lý hoặc không hợp lệ.");
        }

        user.setStatus(status);
        User savedUser = userRepository.save(user);
        return new PendingStaffRegistrationResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.getCreatedAt());
    }

    private void requireManager(Authentication authentication) {
        boolean isManager = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> List.of("ROLE_MANAGER", "ROLE_ADMIN")
                        .contains(authority.getAuthority()));
        if (!isManager) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Chỉ Quản lý mới được duyệt đăng ký nhân viên.");
        }
    }
}
