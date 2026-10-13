package com.sporthub.backend.controller;

import com.sporthub.backend.dto.PendingStaffRegistrationResponse;
import com.sporthub.backend.dto.ManagerUserResponse;
import com.sporthub.backend.dto.ManagerMemberResponse;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    private static final List<String> STAFF_ROLES = List.of("COACH", "RECEPTIONIST");
    private final UserRepository userRepository;

    public ManagerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/staff-registrations")
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

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public Page<ManagerUserResponse> searchUsers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {
        requireManager(authentication);
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số trang không hợp lệ.");
        }
        String normalizedRole = role == null || role.isBlank()
                ? null
                : role.trim().toUpperCase(Locale.ROOT);
        if (normalizedRole != null
                && !List.of("MANAGER", "ADMIN", "COACH", "RECEPTIONIST", "MEMBER").contains(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
        }

        return userRepository.searchManagerUsers(
                        query.trim(),
                        normalizedRole,
                        PageRequest.of(page, Math.min(Math.max(size, 1), 50)))
                .map(user -> new ManagerUserResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getRole(),
                        user.getStatus(),
                        user.getCreatedAt()));
    }

    @GetMapping("/members")
    @Transactional(readOnly = true)
    public Page<ManagerMemberResponse> searchMembers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {
        requireManager(authentication);
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số trang không hợp lệ.");
        }
        String normalizedStatus = status == null || status.isBlank()
                ? null
                : status.trim().toUpperCase(Locale.ROOT);
        if (normalizedStatus != null
                && !List.of("ACTIVE", "PENDING", "LOCKED", "INACTIVE").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ.");
        }

        return userRepository.searchManagerMembers(
                        query.trim(),
                        normalizedStatus,
                        PageRequest.of(page, Math.min(Math.max(size, 1), 50)))
                .map(user -> new ManagerMemberResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getStatus(),
                        user.getCreatedAt()));
    }

    @PatchMapping("/members/{userId}/lock")
    @Transactional
    public ManagerMemberResponse lockMember(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        return updateMemberStatus(userId, "ACTIVE", "LOCKED");
    }

    @PatchMapping("/members/{userId}/unlock")
    @Transactional
    public ManagerMemberResponse unlockMember(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        return updateMemberStatus(userId, "LOCKED", "ACTIVE");
    }

    @PatchMapping("/staff-registrations/{userId}/approve")
    @Transactional
    public PendingStaffRegistrationResponse approveRegistration(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        return decide(userId, "ACTIVE");
    }

    @PatchMapping("/staff-registrations/{userId}/reject")
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

    private ManagerMemberResponse updateMemberStatus(Long userId, String expectedStatus, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (!"MEMBER".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Tài khoản này không phải hội viên.");
        }
        if (!expectedStatus.equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Trạng thái tài khoản đã thay đổi. Vui lòng tải lại danh sách.");
        }

        user.setStatus(status);
        User savedUser = userRepository.save(user);
        return new ManagerMemberResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getStatus(),
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
