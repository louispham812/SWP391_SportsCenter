package com.sporthub.backend.controller;

import com.sporthub.backend.dto.PendingStaffRegistrationResponse;
import com.sporthub.backend.dto.ManagerUserResponse;
import com.sporthub.backend.dto.ManagerMemberResponse;
import com.sporthub.backend.dto.ManagerPackageRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.dto.CreateUserRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.EngagementService;

@RestController
@RequestMapping({"/api/v1/manager", "/api/manager"})
@CrossOrigin(origins = "*")
public class ManagerController {

    private static final List<String> STAFF_ROLES = List.of("COACH", "RECEPTIONIST");
    private final UserRepository userRepository;
    private final MembershipPackageRepository packageRepository;
    private final PublicSportRepository sportRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMembershipRepository userMembershipRepository;
    private final EngagementService engagementService;
    private final RefundRequestRepository refundRequestRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    public ManagerController(
            UserRepository userRepository,
            MembershipPackageRepository packageRepository,
            PublicSportRepository sportRepository,
            PasswordEncoder passwordEncoder,
            UserMembershipRepository userMembershipRepository,
            EngagementService engagementService,
            RefundRequestRepository refundRequestRepository,
            PaymentTransactionRepository paymentTransactionRepository) {
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
        this.sportRepository = sportRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMembershipRepository = userMembershipRepository;
        this.engagementService = engagementService;
        this.refundRequestRepository = refundRequestRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    public ManagerController(
            UserRepository userRepository,
            MembershipPackageRepository packageRepository,
            PublicSportRepository sportRepository,
            PasswordEncoder passwordEncoder) {
        this(userRepository, packageRepository, sportRepository, passwordEncoder, null, null, null, null);
    }

    public ManagerController(
            UserRepository userRepository,
            MembershipPackageRepository packageRepository,
            PublicSportRepository sportRepository) {
        this(userRepository, packageRepository, sportRepository, new BCryptPasswordEncoder(), null, null, null, null);
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

    public record PackageStatusRequest(String status) {
    }

    @GetMapping("/memberships/pending")
    @Transactional(readOnly = true)
    public List<UserMembership> getPendingMemberships(Authentication authentication) {
        requireManager(authentication);
        if (userMembershipRepository == null) return List.of();
        return userMembershipRepository.findByStatusIgnoreCase("PENDING");
    }

    @PostMapping("/memberships/{membershipId}/approve")
    @Transactional
    public UserMembership approveMembership(
            @PathVariable Long membershipId,
            Authentication authentication) {
        requireManager(authentication);
        if (userMembershipRepository == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Repository not initialized.");
        }
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin gói hội viên."));
        if (!"PENDING".equalsIgnoreCase(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói hội viên này không ở trạng thái PENDING hoặc đã được xử lý.");
        }
        MembershipPackage pkg = packageRepository.findById(membership.getPackageId()).orElse(null);
        int duration = pkg != null ? Math.max(1, pkg.getDurationDays()) : 30;
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(duration - 1);

        membership.setStartDate(startDate);
        membership.setEndDate(endDate);
        membership.setStatus("ACTIVE");
        UserMembership saved = userMembershipRepository.save(membership);

        Long managerId = actorId(authentication);
        if (engagementService != null) {
            String pkgName = pkg != null ? pkg.getName() : ("Gói #" + membership.getPackageId());
            engagementService.audit(managerId, "MANAGER", "MEMBERSHIP_APPROVED",
                    "membershipId=" + membershipId + ", userId=" + membership.getUserId() + ", package=" + pkgName);
            engagementService.notifyUser(membership.getUserId(), "Gói hội viên đã kích hoạt",
                    "Gói tập \"" + pkgName + "\" của bạn đã được Quản lý duyệt kích hoạt thành công (Hạn: " + endDate + ").", "MEMBERSHIP");
        }
        return saved;
    }

    @PostMapping("/memberships/{membershipId}/reject")
    @Transactional
    public UserMembership rejectMembership(
            @PathVariable Long membershipId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        requireManager(authentication);
        if (userMembershipRepository == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Repository not initialized.");
        }
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin gói hội viên."));
        if (!"PENDING".equalsIgnoreCase(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói hội viên này không ở trạng thái PENDING hoặc đã được xử lý.");
        }
        membership.setStatus("REJECTED");
        UserMembership saved = userMembershipRepository.save(membership);

        MembershipPackage pkg = packageRepository.findById(membership.getPackageId()).orElse(null);
        BigDecimal amount = pkg != null ? pkg.getPrice() : BigDecimal.ZERO;
        User member = userRepository.findById(membership.getUserId()).orElse(null);
        Long managerId = actorId(authentication);
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason").trim()
                : "Quản lý từ chối kích hoạt gói tập #" + membershipId;

        if (refundRequestRepository != null) {
            RefundRequest refund = RefundRequest.builder()
                    .memberId(membership.getUserId())
                    .memberName(member != null ? member.getFullName() : "Hội viên")
                    .phone(member != null ? member.getPhone() : "")
                    .refundAmount(amount)
                    .reason(reason)
                    .status("APPROVED")
                    .approvedBy(managerId)
                    .decisionNote("Tự động tạo lệnh hoàn tiền 100% do Quản lý từ chối kích hoạt gói tập")
                    .createdAt(LocalDateTime.now())
                    .build();
            refundRequestRepository.save(refund);
        }

        if (paymentTransactionRepository != null) {
            paymentTransactionRepository.findByMemberIdOrderByCreatedAtDesc(membership.getUserId()).stream()
                    .filter(tx -> "MEMBERSHIP_PACKAGE".equalsIgnoreCase(tx.getBookingType()) && !"REFUNDED".equalsIgnoreCase(tx.getPaymentStatus()))
                    .findFirst()
                    .ifPresent(tx -> {
                        tx.setPaymentStatus("REFUNDED");
                        paymentTransactionRepository.save(tx);
                    });
        }

        if (engagementService != null) {
            engagementService.audit(managerId, "MANAGER", "MEMBERSHIP_REJECTED",
                    "membershipId=" + membershipId + ", userId=" + membership.getUserId() + ", reason=" + reason);
            engagementService.notifyUser(membership.getUserId(), "Yêu cầu gói hội viên bị từ chối",
                    "Yêu cầu kích hoạt gói tập của bạn đã bị từ chối. Lý do: " + reason + ". Số tiền đã được chuyển sang quy trình hoàn tiền.", "MEMBERSHIP");
        }
        return saved;
    }

    @PatchMapping("/members/{userId}/lock")
    @Transactional
    public ManagerMemberResponse lockMember(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        Long currentManagerId = actorId(authentication);
        if (userId.equals(currentManagerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự khóa tài khoản của chính mình (BR-03).");
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (List.of("MANAGER", "ADMIN").contains(target.getRole().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không được phép khóa tài khoản Quản trị viên hoặc Quản lý (BR-03).");
        }
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
        if (List.of("MANAGER", "ADMIN").contains(user.getRole().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Không thể thao tác trên tài khoản Quản lý hoặc Quản trị viên (BR-03).");
        }
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
        if (List.of("MANAGER", "ADMIN").contains(user.getRole().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Không được phép khóa tài khoản Quản trị viên hoặc Quản lý (BR-03).");
        }
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
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã tồn tại trong hệ thống.");
        }

        boolean isManagerUser = isManager(authentication);
        if (!isManagerUser) {
            // Lễ tân tạo ở trang quản trị: MEMBER, COACH hoặc RECEPTIONIST
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lễ tân chỉ có quyền tạo tài khoản Hội viên, Huấn luyện viên hoặc Lễ tân.");
            }
        } else {
            // Manager tạo ở trang quản trị: cả 4 vai trò
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER", "ADMIN").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
            }
        }

        // Chuẩn hóa ADMIN -> MANAGER để đảm bảo toàn vẹn ràng buộc CSDL (BR-01)
        if ("ADMIN".equalsIgnoreCase(targetRole)) {
            targetRole = "MANAGER";
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(targetRole)
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);
        return new ManagerUserResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
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

    private Long actorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }
}
