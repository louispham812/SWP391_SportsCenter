package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateUserRequest;
import com.sporthub.backend.dto.ManagerMemberResponse;
import com.sporthub.backend.dto.ManagerPackageRequest;
import com.sporthub.backend.dto.ManagerUserResponse;
import com.sporthub.backend.dto.MembershipQuotaResponse;
import com.sporthub.backend.dto.PendingStaffRegistrationResponse;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.AuditLogService;
import com.sporthub.backend.service.AuthService;
import com.sporthub.backend.service.EmailService;
import com.sporthub.backend.service.MembershipService;
import com.sporthub.backend.util.CoachSportHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    @Autowired(required = false)
    private UserMembershipRepository userMembershipRepository;

    @Autowired(required = false)
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired(required = false)
    private SportRepository domainSportRepository;

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
                        user.getCreatedAt(),
                        user.getSpecialty()))
                .toList();
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public Page<ManagerUserResponse> searchUsers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "false") boolean staffOnly,
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

        List<Sport> allSports = loadDomainSports();
        Page<User> users = staffOnly
                ? userRepository.searchManagerStaff(
                        query.trim(),
                        normalizedRole,
                        PageRequest.of(page, Math.min(Math.max(size, 1), 50)))
                : userRepository.searchManagerUsers(
                        query.trim(),
                        normalizedRole,
                        PageRequest.of(page, Math.min(Math.max(size, 1), 50)));
        return users.map(user -> toUserResponse(user, allSports));
    }

    public Page<ManagerUserResponse> searchUsers(
            String query,
            String role,
            int page,
            int size,
            Authentication authentication) {
        return searchUsers(query, role, false, page, size, authentication);
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
        validateTierAvailability(membershipPackage);
        MembershipPackage saved = packageRepository.save(membershipPackage);
        auditManagerAction(authentication, "CREATE_PACKAGE", "packageId=" + saved.getPackageId() + ", name=" + saved.getName());
        return saved;
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
        validateTierAvailability(membershipPackage);
        MembershipPackage saved = packageRepository.save(membershipPackage);
        auditManagerAction(authentication, "UPDATE_PACKAGE", "packageId=" + saved.getPackageId() + ", name=" + saved.getName());
        return saved;
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
        validateTierAvailability(membershipPackage);
        MembershipPackage saved = packageRepository.save(membershipPackage);
        auditManagerAction(authentication, "UPDATE_PACKAGE_STATUS", "packageId=" + packageId + ", status=" + saved.getStatus());
        return saved;
    }

    @PatchMapping("/members/{userId}/lock")
    @Transactional
    public ManagerMemberResponse lockMember(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        Long currentManagerId = actorId(authentication);
        if (currentManagerId != null && currentManagerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quản lý không thể tự khóa tài khoản của chính mình (BR-03).");
        }
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        if ("MANAGER".equalsIgnoreCase(targetUser.getRole()) || "ADMIN".equalsIgnoreCase(targetUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể khóa tài khoản có vai trò Quản lý hoặc Quản trị viên (BR-03).");
        }
        ManagerMemberResponse res = updateMemberStatus(userId, "ACTIVE", "LOCKED");
        auditManagerAction(authentication, "LOCK_MEMBER", "userId=" + userId);
        return res;
    }

    @PatchMapping("/members/{userId}/unlock")
    @Transactional
    public ManagerMemberResponse unlockMember(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        ManagerMemberResponse res = updateMemberStatus(userId, "LOCKED", "ACTIVE");
        auditManagerAction(authentication, "UNLOCK_MEMBER", "userId=" + userId);
        return res;
    }

    @PatchMapping("/staff-registrations/{userId}/approve")
    @Transactional
    public PendingStaffRegistrationResponse approveRegistration(
            @PathVariable Long userId,
            @RequestBody(required = false) UpdateCoachSportsRequest request,
            Authentication authentication) {
        requireManager(authentication);
        PendingStaffRegistrationResponse res = decide(userId, "ACTIVE", request);
        auditManagerAction(authentication, "APPROVE_STAFF_REGISTRATION", "userId=" + userId + ", role=" + res.role());
        return res;
    }

    public PendingStaffRegistrationResponse approveRegistration(
            Long userId,
            Authentication authentication) {
        return approveRegistration(userId, null, authentication);
    }

    @PatchMapping("/staff-registrations/{userId}/reject")
    @Transactional
    public PendingStaffRegistrationResponse rejectRegistration(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        PendingStaffRegistrationResponse res = decide(userId, "INACTIVE", null);
        auditManagerAction(authentication, "REJECT_STAFF_REGISTRATION", "userId=" + userId + ", role=" + res.role());
        return res;
    }

    @GetMapping("/memberships/pending")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingMemberships(Authentication authentication) {
        requireManager(authentication);
        if (userMembershipRepository == null) {
            return List.of();
        }
        List<UserMembership> list = userMembershipRepository.findAll().stream()
                .filter(m -> "PENDING".equalsIgnoreCase(m.getStatus()) || "PENDING_APPROVAL".equalsIgnoreCase(m.getStatus()))
                .toList();

        return list.stream().map(um -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("membershipId", um.getMembershipId());
            row.put("memberId", um.getUserId());

            User user = userRepository.findById(um.getUserId()).orElse(null);
            row.put("memberName", user != null ? user.getFullName() : "Hội viên #" + um.getUserId());
            row.put("memberPhone", user != null && user.getPhone() != null ? user.getPhone() : (user != null ? user.getEmail() : "—"));
            row.put("memberEmail", user != null ? user.getEmail() : "");

            MembershipPackage pkg = packageRepository.findById(um.getPackageId()).orElse(null);
            row.put("packageName", pkg != null ? pkg.getName() : "Gói tập #" + um.getPackageId());
            row.put("packageType", pkg != null && pkg.getPackageType() != null ? pkg.getPackageType().name() : "VIP");
            row.put("accessType", pkg != null ? pkg.getAccessType() : "ALL_DAY");
            row.put("membershipTier", pkg != null ? pkg.getMembershipTier() : null);
            row.put("price", pkg != null ? pkg.getPrice() : 0);
            row.put("paymentMethod", "VNPAY");
            row.put("referenceCode", "VNP-MBR-" + um.getMembershipId());
            row.put("quotaCourtHours", pkg != null && pkg.getQuotaCourts() != null ? pkg.getQuotaCourts() : 0);
            row.put("quotaClassSessions", pkg != null && pkg.getQuotaSessions() != null ? pkg.getQuotaSessions() : 0);
            row.put("quotaPtSessions", 0);
            row.put("status", um.getStatus());

            LocalDateTime createdTime = null;
            if (paymentTransactionRepository != null) {
                List<PaymentTransaction> txs = paymentTransactionRepository.findByMemberIdOrderByCreatedAtDesc(um.getUserId());
                PaymentTransaction matched = txs.stream()
                        .filter(tx -> tx.getMembershipId() != null && tx.getMembershipId().equals(um.getMembershipId()))
                        .findFirst()
                        .orElseGet(() -> txs.stream()
                                .filter(tx -> tx.getMembershipId() == null
                                        && ("MEMBERSHIP".equalsIgnoreCase(tx.getBookingType())
                                                || "MEMBERSHIP".equalsIgnoreCase(tx.getItemType())))
                                .findFirst()
                                .orElse(null));
                if (matched != null) {
                    createdTime = matched.getCreatedAt();
                    if (matched.getReferenceCode() != null && !matched.getReferenceCode().isBlank()) {
                        row.put("referenceCode", matched.getReferenceCode());
                    }
                    if (matched.getPaymentMethod() != null && !matched.getPaymentMethod().isBlank()) {
                        row.put("paymentMethod", matched.getPaymentMethod());
                    }
                    if (matched.getAmount() != null) {
                        row.put("price", matched.getAmount());
                    }
                }
            }
            if (createdTime == null && um.getStartDate() != null) {
                createdTime = um.getStartDate().atStartOfDay();
            }
            if (createdTime == null) {
                createdTime = LocalDateTime.now();
            }
            row.put("createdAt", createdTime.toString());
            row.put("startDate", um.getStartDate());
            row.put("endDate", um.getEndDate());
            return row;
        }).toList();
    }

    /**
     * MGR-08: Manager approve membership
     * PENDING_APPROVAL -> ACTIVE
     */
    @RequestMapping(value = "/memberships/{membershipId}/approve", method = {RequestMethod.PATCH, RequestMethod.POST})
    @Transactional
    public MembershipQuotaResponse approveMembership(
            @PathVariable Long membershipId,
            Authentication authentication) {
        requireManager(authentication);
        
        Long managerId = resolveManagerId(authentication);

        membershipService.approveMembership(membershipId, managerId);
        auditManagerAction(authentication, "APPROVE_MEMBERSHIP", "membershipId=" + membershipId);

        UserMembership approved = userMembershipRepository != null
                ? userMembershipRepository.findById(membershipId).orElse(null)
                : null;
        MembershipPackage pkg = (approved != null && approved.getPackageId() != null)
                ? packageRepository.findById(approved.getPackageId()).orElse(null)
                : null;
        if (approved != null) {
            return new MembershipQuotaResponse(
                    membershipId,
                    pkg != null && pkg.getName() != null ? pkg.getName() : "Membership Package",
                    approved.getRemainingQuotaCourts() != null ? approved.getRemainingQuotaCourts() : 0,
                    approved.getRemainingQuotaSessions() != null ? approved.getRemainingQuotaSessions() : 0
            );
        }
        return new MembershipQuotaResponse(
                membershipId,
                "Membership Package",
                0,
                0
        );
    }

    public String rejectMembership(Long membershipId, String reason, Authentication authentication) {
        rejectMembership(membershipId, reason != null ? Map.of("reason", reason) : null, reason, authentication);
        return "Membership đã bị từ chối thành công";
    }

    /**
     * MGR-09: Manager reject membership
     * PENDING_APPROVAL -> REJECTED
     */
    @RequestMapping(value = "/memberships/{membershipId}/reject", method = {RequestMethod.PATCH, RequestMethod.POST})
    @Transactional
    public Map<String, Object> rejectMembership(
            @PathVariable Long membershipId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        requireManager(authentication);
        
        Long managerId = resolveManagerId(authentication);

        String rejectReason = (body != null && body.get("reason") != null && !body.get("reason").toString().isBlank())
                ? body.get("reason").toString().trim()
                : (reason != null && !reason.isBlank() ? reason.trim() : "Không đạt yêu cầu duyệt");
        
        membershipService.rejectMembership(membershipId, rejectReason, managerId);
        auditManagerAction(authentication, "REJECT_MEMBERSHIP", "membershipId=" + membershipId + ", reason=" + rejectReason);

        return Map.of("message", "Membership đã bị từ chối thành công", "success", true);
    }

    private Long resolveManagerId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Manager không tồn tại");
        }
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(authentication.getName());
        if (byEmail.isPresent()) {
            return byEmail.get().getUserId();
        }
        try {
            Long id = Long.valueOf(authentication.getName());
            return userRepository.findById(id).map(User::getUserId).orElse(id);
        } catch (NumberFormatException ignored) {
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Manager không tồn tại");
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
        if (!phone.matches("^[0-9]{10,15}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại phải gồm 10 đến 15 chữ số.");
        }
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 8 ký tự.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại này đã được sử dụng bởi tài khoản khác.");
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
            if (!"MEMBER".equals(targetRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lễ tân chỉ được phép tạo tài khoản Hội viên (MEMBER).");
            }
        } else {
            if ("ADMIN".equals(targetRole)) {
                targetRole = "MANAGER";
            }
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
            }
        }

        String cleanRfid = request.rfidCode() == null || request.rfidCode().isBlank() ? null : request.rfidCode().trim();
        if (cleanRfid != null && userRepository.existsByRfidCodeAndUserIdNot(cleanRfid, -1L)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã thẻ RFID này đã được cấp cho tài khoản khác.");
        }
        String cleanGender = request.gender() == null || request.gender().isBlank() ? null : request.gender().trim().toUpperCase(Locale.ROOT);
        String cleanAddress = request.address() == null || request.address().isBlank() ? null : request.address().trim();
        String cleanEmergencyName = request.emergencyContactName() == null || request.emergencyContactName().isBlank() ? null : request.emergencyContactName().trim();
        String cleanEmergencyPhone = request.emergencyContactPhone() == null || request.emergencyContactPhone().isBlank() ? null : request.emergencyContactPhone().trim();
        if (cleanEmergencyPhone != null && !cleanEmergencyPhone.matches("^[0-9]{10,15}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại liên hệ khẩn cấp phải gồm 10 đến 15 chữ số.");
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
                .dateOfBirth(request.dateOfBirth())
                .gender(cleanGender)
                .address(cleanAddress)
                .rfidCode(cleanRfid)
                .emergencyContactName(cleanEmergencyName)
                .emergencyContactPhone(cleanEmergencyPhone)
                .build();
        if ("COACH".equals(targetRole)) {
            CoachSportHelper.syncCoachSports(
                    user, request.sportIds(), request.specialty(), domainSportRepository, true);
        }

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
        
        return toUserResponse(savedUser, loadDomainSports());
    }

    @PutMapping("/coaches/{coachId}/sports")
    @Transactional
    public ManagerUserResponse updateCoachSports(
            @PathVariable Long coachId,
            @RequestBody UpdateCoachSportsRequest request,
            Authentication authentication) {
        requireManager(authentication);
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy huấn luyện viên."));
        if (!"COACH".equalsIgnoreCase(coach.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người dùng này không phải Huấn luyện viên.");
        }
        CoachSportHelper.syncCoachSports(
                coach,
                request != null ? request.sportIds() : null,
                request != null ? request.specialty() : null,
                domainSportRepository,
                true);
        User saved = userRepository.save(coach);
        return toUserResponse(saved, loadDomainSports());
    }

    private void validatePackage(ManagerPackageRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin gói tập không hợp lệ.");
        }
        if (request.name() == null || request.name().isBlank() || request.name().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Tên gói tập là bắt buộc và tối đa 100 ký tự.");
        }
        if (request.membershipTier() != null && request.membershipTier().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Mã hạng hội viên tối đa 100 ký tự.");
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
        if (request.quotaSessions() != null && request.quotaSessions() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số buổi tập không được âm.");
        }
        if (request.quotaCourts() != null && request.quotaCourts() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số giờ sân không được âm.");
        }
        if (request.sportId() != null && !sportRepository.existsById(request.sportId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy bộ môn đã chọn.");
        }
    }

    private void validateTierAvailability(MembershipPackage membershipPackage) {
        if (!"ACTIVE".equals(membershipPackage.getStatus())) return;
        long excludeId = membershipPackage.getPackageId() == null ? -1L : membershipPackage.getPackageId();
        if (membershipPackage.getMembershipTier() != null && !membershipPackage.getMembershipTier().isBlank()
                && packageRepository.existsByMembershipTierIgnoreCaseAndStatusAndPackageIdNot(
                        membershipPackage.getMembershipTier(), "ACTIVE", excludeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hạng này đã mở bán. Hãy cập nhật cấu hình hiện có.");
        }
        if (packageRepository.existsByNameIgnoreCaseAndStatusAndPackageIdNot(
                membershipPackage.getName(), "ACTIVE", excludeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên hạng hội viên này đã mở bán. Vui lòng chọn tên khác hoặc cập nhật gói hiện có.");
        }
    }

    private void applyPackageRequest(MembershipPackage membershipPackage, ManagerPackageRequest request) {
        if (request.membershipTier() != null) {
            membershipPackage.setMembershipTier(com.sporthub.backend.enums.MembershipTier.normalize(request.membershipTier()));
        }
        membershipPackage.setName(request.name().trim());
        boolean presetTier = com.sporthub.backend.enums.MembershipTier.fromString(membershipPackage.getMembershipTier()).isPresent();
        if (membershipPackage.getPackageType() == null || presetTier) {
            membershipPackage.setPackageType(com.sporthub.backend.enums.PackageType.VIP);
        }
        membershipPackage.setSportId(presetTier ? null : request.sportId());
        membershipPackage.setPrice(request.price());
        membershipPackage.setDurationDays(request.durationDays());
        membershipPackage.setAccessType(request.accessType().trim().toUpperCase(Locale.ROOT));
        if (request.quotaSessions() != null) {
            membershipPackage.setQuotaSessions(request.quotaSessions());
        } else if (membershipPackage.getQuotaSessions() == null) {
            membershipPackage.setQuotaSessions(0);
        }
        if (request.quotaCourts() != null) {
            membershipPackage.setQuotaCourts(request.quotaCourts());
        } else if (membershipPackage.getQuotaCourts() == null) {
            membershipPackage.setQuotaCourts(0);
        }
        membershipPackage.setDescription(
                request.description() == null || request.description().isBlank()
                        ? null
                        : request.description().trim());
        membershipPackage.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
    }

    private PendingStaffRegistrationResponse decide(
            Long userId,
            String status,
            UpdateCoachSportsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký nhân viên."));
        if (!"PENDING".equalsIgnoreCase(user.getStatus())
                || !STAFF_ROLES.contains(user.getRole().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Đăng ký này đã được xử lý hoặc không hợp lệ.");
        }

        if ("ACTIVE".equals(status) && "COACH".equalsIgnoreCase(user.getRole())) {
            if (request != null) {
                if ((request.sportIds() == null || request.sportIds().isEmpty())
                        && (request.specialty() == null || request.specialty().isBlank())) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Vui lòng chọn ít nhất một bộ môn giảng dạy cho Huấn luyện viên.");
                }
                CoachSportHelper.applyCoachSports(
                        user, request.sportIds(), request.specialty(), domainSportRepository, true);
            } else if ((user.getCoachedSports() == null || user.getCoachedSports().isEmpty())
                    && (user.getSpecialty() == null || user.getSpecialty().isBlank())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Vui lòng chọn ít nhất một bộ môn giảng dạy cho Huấn luyện viên.");
            }
        }

        user.setStatus(status);
        User savedUser = userRepository.save(user);
        return new PendingStaffRegistrationResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.getCreatedAt(),
                savedUser.getSpecialty());
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

    private Long actorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException e) {
            return userRepository.findByEmailIgnoreCase(authentication.getName())
                    .map(User::getUserId)
                    .orElse(null);
        }
    }

    private List<Sport> loadDomainSports() {
        return domainSportRepository == null ? List.of() : domainSportRepository.findAllByOrderBySportIdAsc();
    }

    private ManagerUserResponse toUserResponse(User user, List<Sport> allSports) {
        return new ManagerUserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getSpecialty(),
                CoachSportHelper.resolveCoachSportIds(user, allSports));
    }

    @PutMapping("/users/{userId}")
    @Transactional
    public ManagerUserResponse updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateStaffUserRequest request,
            Authentication authentication) {
        requireManager(authentication);
        if (request == null || request.fullName() == null || request.fullName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ tên không được để trống.");
        }
        String cleanName = request.fullName().trim();
        if (cleanName.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ tên không được vượt quá 100 ký tự.");
        }
        String cleanPhone = request.phone() == null || request.phone().isBlank() ? null : request.phone().trim();
        if (cleanPhone != null) {
            if (!cleanPhone.matches("^[0-9]{10,15}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại phải gồm 10 đến 15 chữ số.");
            }
            if (userRepository.existsByPhoneAndUserIdNot(cleanPhone, userId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại này đã được sử dụng bởi tài khoản khác.");
            }
        }
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
        String normalizedRole = request.role() == null || request.role().isBlank()
                ? targetUser.getRole()
                : request.role().trim().toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(normalizedRole)) {
            normalizedRole = "MANAGER";
        }
        if (!List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER").contains(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
        }
        Long currentManagerId = actorId(authentication);
        if (currentManagerId != null && currentManagerId.equals(userId) && !"MANAGER".equals(normalizedRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự hạ vai trò của chính mình.");
        }
        targetUser.setFullName(cleanName);
        targetUser.setPhone(cleanPhone);
        targetUser.setRole(normalizedRole);
        if ("COACH".equals(normalizedRole)) {
            if (request.sportIds() != null && !request.sportIds().isEmpty()) {
                CoachSportHelper.syncCoachSports(targetUser, request.sportIds(), null, domainSportRepository, false);
            }
        } else {
            if (targetUser.getCoachedSports() != null) {
                targetUser.getCoachedSports().clear();
            }
            targetUser.setSpecialty(null);
        }
        User saved = userRepository.save(targetUser);
        auditManagerAction(authentication, "UPDATE_USER", "userId=" + saved.getUserId() + ", role=" + saved.getRole());
        return toUserResponse(saved, loadDomainSports());
    }

    @PatchMapping("/users/{userId}/lock")
    @Transactional
    public ManagerUserResponse lockUser(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        Long currentManagerId = actorId(authentication);
        if (currentManagerId != null && currentManagerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quản lý không thể tự khóa tài khoản của chính mình (BR-03).");
        }
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        if ("MANAGER".equalsIgnoreCase(targetUser.getRole()) || "ADMIN".equalsIgnoreCase(targetUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể khóa tài khoản có vai trò Quản lý (BR-03).");
        }
        if (!"ACTIVE".equalsIgnoreCase(targetUser.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể khóa tài khoản đang hoạt động.");
        }
        targetUser.setStatus("LOCKED");
        User saved = userRepository.save(targetUser);
        auditManagerAction(authentication, "LOCK_USER", "userId=" + userId);
        return toUserResponse(saved, loadDomainSports());
    }

    @PatchMapping("/users/{userId}/unlock")
    @Transactional
    public ManagerUserResponse unlockUser(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));
        if (!"LOCKED".equalsIgnoreCase(targetUser.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tài khoản không ở trạng thái bị khóa.");
        }
        targetUser.setStatus("ACTIVE");
        User saved = userRepository.save(targetUser);
        auditManagerAction(authentication, "UNLOCK_USER", "userId=" + userId);
        return toUserResponse(saved, loadDomainSports());
    }

    @DeleteMapping("/users/{userId}")
    public Map<String, Object> deleteUser(
            @PathVariable Long userId,
            Authentication authentication) {
        requireManager(authentication);
        Long currentManagerId = actorId(authentication);
        if (currentManagerId != null && currentManagerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quản lý không thể tự xóa tài khoản của chính mình.");
        }
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
        if ("MANAGER".equalsIgnoreCase(targetUser.getRole()) || "ADMIN".equalsIgnoreCase(targetUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể xóa tài khoản Quản lý.");
        }
        String targetLabel = "MEMBER".equalsIgnoreCase(targetUser.getRole()) ? "hội viên" : "nhân sự";
        try {
            userRepository.deleteById(userId);
            auditManagerAction(authentication, "DELETE_USER", "userId=" + userId + ", softDeleted=false");
            return Map.of("deleted", true, "softDeleted", false, "message", "Đã xóa tài khoản " + targetLabel + ".");
        } catch (DataIntegrityViolationException ex) {
            targetUser.setStatus("INACTIVE");
            userRepository.save(targetUser);
            auditManagerAction(authentication, "DELETE_USER", "userId=" + userId + ", softDeleted=true");
            return Map.of(
                    "deleted", true,
                    "softDeleted", true,
                    "message", ("MEMBER".equalsIgnoreCase(targetUser.getRole()) ? "Hội viên" : "Nhân sự")
                            + " đã có dữ liệu lịch sử nên đã được ngừng hoạt động.");
        }
    }

    private void auditManagerAction(Authentication authentication, String logType, String detail) {
        if (auditLogService == null) {
            return;
        }
        Long managerId = actorId(authentication);
        String managerEmail = managerId != null
                ? userRepository.findById(managerId).map(User::getEmail).orElse(authentication != null ? authentication.getName() : null)
                : (authentication != null ? authentication.getName() : null);
        auditLogService.logSuccess(logType, managerEmail, managerId, detail);
    }

    public record PackageStatusRequest(String status) {}
    public record UpdateCoachSportsRequest(List<Long> sportIds, String specialty) {}
    public record UpdateStaffUserRequest(String fullName, String phone, String role, List<Long> sportIds) {}
}
