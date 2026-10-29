package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateUserRequest;
import com.sporthub.backend.dto.ManagerMemberResponse;
import com.sporthub.backend.dto.ManagerPackageRequest;
import com.sporthub.backend.dto.ManagerUserResponse;
import com.sporthub.backend.dto.MembershipQuotaResponse;
import com.sporthub.backend.dto.PendingStaffRegistrationResponse;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.AuditLogService;
import com.sporthub.backend.service.AuthService;
import com.sporthub.backend.service.EmailService;
import com.sporthub.backend.service.MembershipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/manager")
@CrossOrigin(origins = "*")
public class ManagerController {

    private static final List<String> STAFF_ROLES = List.of("COACH", "RECEPTIONIST");
    
    private final UserRepository userRepository;
    private final MembershipPackageRepository packageRepository;
    private final PublicSportRepository sportRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final AuthService authService;
    private final MembershipService membershipService;

    @Autowired
    public ManagerController(
            UserRepository userRepository,
            MembershipPackageRepository packageRepository,
            PublicSportRepository sportRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditLogService auditLogService,
            AuthService authService,
            MembershipService membershipService) {
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
        this.sportRepository = sportRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.authService = authService;
        this.membershipService = membershipService;
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

    @GetMapping("/packages")
    @Transactional(readOnly = true)
    public List<MembershipPackage> getPackages(Authentication authentication) {
        requireManager(authentication);
        return packageRepository.findAllByOrderByPackageIdDesc();
    }

    @GetMapping("/sports")
    @Transactional(readOnly = true)
    public List<PublicSport> getSports(Authentication authentication) {
        requireManager(authentication);
        return sportRepository.findAllByOrderBySportIdAsc();
    }

    @PostMapping("/packages")
    @Transactional
    public MembershipPackage createPackage(
            @RequestBody ManagerPackageRequest request,
            Authentication authentication) {
        requireManager(authentication);
        validatePackage(request);
        MembershipPackage membershipPackage = new MembershipPackage();
        applyPackageRequest(membershipPackage, request);
        return packageRepository.save(membershipPackage);
    }

    @PutMapping("/packages/{packageId}")
    @Transactional
    public MembershipPackage updatePackage(
            @PathVariable Long packageId,
            @RequestBody ManagerPackageRequest request,
            Authentication authentication) {
        requireManager(authentication);
        validatePackage(request);
        MembershipPackage membershipPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy gói tập."));
        applyPackageRequest(membershipPackage, request);
        return packageRepository.save(membershipPackage);
    }

    @PatchMapping("/packages/{packageId}/status")
    @Transactional
    public MembershipPackage updatePackageStatus(
            @PathVariable Long packageId,
            @RequestBody PackageStatusRequest request,
            Authentication authentication) {
        requireManager(authentication);
        if (request.status() == null
                || !List.of("ACTIVE", "INACTIVE").contains(request.status().trim().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái gói tập không hợp lệ.");
        }
        MembershipPackage membershipPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy gói tập."));
        membershipPackage.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
        return packageRepository.save(membershipPackage);
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

    /**
     * MGR-08: Manager approve membership
     * PENDING_APPROVAL -> ACTIVE
     */
    @PatchMapping("/memberships/{membershipId}/approve")
    @Transactional
    public MembershipQuotaResponse approveMembership(
            @PathVariable Long membershipId,
            Authentication authentication) {
        requireManager(authentication);
        
        User manager = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Manager không tồn tại"));

        membershipService.approveMembership(membershipId, manager.getUserId());

        return new MembershipQuotaResponse(
                membershipId,
                "Membership Package", 
                0,
                0
        );
    }

    /**
     * MGR-09: Manager reject membership
     * PENDING_APPROVAL -> REJECTED
     */
    @PatchMapping("/memberships/{membershipId}/reject")
    @Transactional
    public String rejectMembership(
            @PathVariable Long membershipId,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        requireManager(authentication);
        
        User manager = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Manager không tồn tại"));

        String rejectReason = reason == null || reason.isBlank() 
                ? "Không đạt yêu cầu duyệt" 
                : reason.trim();
        
        membershipService.rejectMembership(membershipId, rejectReason, manager.getUserId());

        return "Membership đã bị từ chối thành công";
    }

    @PostMapping("/users")
    @Transactional
    public ManagerUserResponse createUser(
            @RequestBody CreateUserRequest request,
            Authentication authentication) {
        requireStaffOrManager(authentication);

        String fullName = request.fullName() == null ? "" : request.fullName().trim();
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        String phone = request.phone() == null ? "" : request.phone().trim();
        String password = request.password();
        String targetRole = request.role() == null ? "" : request.role().trim().toUpperCase(Locale.ROOT);

        if (fullName.isEmpty() || email.isEmpty() || phone.isEmpty() || password == null || password.isBlank() || targetRole.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng điền đầy đủ các thông tin bắt buộc.");
        }
        if (fullName.length() > 100 || email.length() > 100 || phone.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên, email hoặc số điện thoại vượt quá độ dài cho phép.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Địa chỉ email không hợp lệ.");
        }
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 8 ký tự.");
        }
        
        Optional<User> existingUser = authService.findUserByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            String status = user.getStatus();
            
            if ("PENDING".equalsIgnoreCase(status)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Email này đang chờ xác thực OTP. Người dùng có thể đăng nhập để nhận lại mã OTP.");
            } else if ("ACTIVE".equalsIgnoreCase(status)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    String.format("Email đã được sử dụng bởi %s (%s).", user.getFullName(), user.getRole()));
            } else if ("LOCKED".equalsIgnoreCase(status)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Email này tồn tại với tài khoản bị khóa. Vui lòng kiểm tra lại.");
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã tồn tại trong hệ thống.");
            }
        }

        boolean isManagerUser = isManager(authentication);
        if (!isManagerUser) {
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lễ tân chỉ có quyền tạo tài khoản Hội viên, Huấn luyện viên hoặc Lễ tân.");
            }
        } else {
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER", "ADMIN").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
            }
        }

        boolean requirePasswordChange = true;

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(targetRole)
                .status("ACTIVE")
                .requirePasswordChange(requirePasswordChange)
                .build();

        User savedUser = userRepository.save(user);
        
        try {
            emailService.sendTemporaryPasswordEmail(savedUser.getEmail(), savedUser.getFullName(), password, savedUser.getRole());
            auditLogService.logSuccess("CREATE_USER_ADMIN_PANEL", savedUser.getEmail(), savedUser.getUserId(), 
                    "User created via Admin Panel | Role: " + savedUser.getRole() + " | RequirePasswordChange: true | Temporary password sent");
        } catch (Exception e) {
            auditLogService.logFailure("CREATE_USER_ADMIN_PANEL", 
                    savedUser.getEmail(), savedUser.getUserId(), 
                    "User created but email failed | Role: " + savedUser.getRole(), 
                    e.getMessage());
        }
        
        return new ManagerUserResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.getStatus(),
                savedUser.getCreatedAt());
    }

    private void validatePackage(ManagerPackageRequest request) {
        if (request.name() == null || request.name().isBlank() || request.name().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tên gói tập là bắt buộc và tối đa 100 ký tự.");
        }
        if (request.price() == null || request.price().signum() <= 0
                || request.price().scale() > 2 || request.price().precision() > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Giá gói tập phải lớn hơn 0 và tối đa 10 chữ số, 2 chữ số thập phân.");
        }
        if (request.durationDays() == null || request.durationDays() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời hạn gói tập phải lớn hơn 0 ngày.");
        }
        if (request.accessType() == null
                || !List.of("ALL_DAY", "PEAK", "OFF_PEAK")
                        .contains(request.accessType().trim().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ áp dụng không hợp lệ.");
        }
        if (request.status() == null
                || !List.of("ACTIVE", "INACTIVE").contains(request.status().trim().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái gói tập không hợp lệ.");
        }
        if (request.sportId() != null && !sportRepository.existsById(request.sportId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy bộ môn đã chọn.");
        }
    }

    private void applyPackageRequest(MembershipPackage membershipPackage, ManagerPackageRequest request) {
        membershipPackage.setName(request.name().trim());
        membershipPackage.setSportId(request.sportId());
        membershipPackage.setPrice(request.price());
        membershipPackage.setDurationDays(request.durationDays());
        membershipPackage.setAccessType(request.accessType().trim().toUpperCase(Locale.ROOT));
        membershipPackage.setDescription(
                request.description() == null || request.description().isBlank()
                        ? null
                        : request.description().trim());
        membershipPackage.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
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

    private void requireStaffOrManager(Authentication authentication) {
        boolean hasAccess = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> List.of("ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_ADMIN")
                        .contains(authority.getAuthority()));
        if (!hasAccess) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
        }
    }

    private boolean isManager(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> List.of("ROLE_MANAGER", "ROLE_ADMIN")
                        .contains(authority.getAuthority()));
    }

    private void requireManager(Authentication authentication) {
        if (!isManager(authentication)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Chỉ Quản lý mới được thực hiện thao tác này.");
        }
    }

    public record PackageStatusRequest(String status) {}
}
