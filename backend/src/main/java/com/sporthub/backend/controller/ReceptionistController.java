package com.sporthub.backend.controller;

import com.sporthub.backend.dto.ReceptionistMemberResponse;
import com.sporthub.backend.dto.MemberPackagePurchaseResponse;
import com.sporthub.backend.dto.ReceptionistMembershipSaleRequest;
import com.sporthub.backend.dto.ReceptionistCheckInRequest;
import com.sporthub.backend.dto.ReceptionistCheckInResponse;
import com.sporthub.backend.dto.ReceptionistReportResponse;
import com.sporthub.backend.entity.MemberCheckIn;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.sporthub.backend.dto.CreateUserRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/receptionist")
@CrossOrigin(origins = "*")
public class ReceptionistController {

    private final UserRepository userRepository;
    private final ReceptionPaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserMembershipRepository membershipRepository;
    private final MembershipPackageRepository packageRepository;
    private final MemberCheckInRepository checkInRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.sporthub.backend.service.EmailService emailService;
    private final com.sporthub.backend.service.AuditLogService auditLogService;
    private final com.sporthub.backend.service.AuthService authService;

    @Autowired
    public ReceptionistController(
            UserRepository userRepository,
            ReceptionPaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            MemberCheckInRepository checkInRepository,
            PasswordEncoder passwordEncoder,
            com.sporthub.backend.service.EmailService emailService,
            com.sporthub.backend.service.AuditLogService auditLogService,
            com.sporthub.backend.service.AuthService authService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.checkInRepository = checkInRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.authService = authService;
    }

    @GetMapping("/members")
    @Transactional(readOnly = true)
    public Page<ReceptionistMemberResponse> searchMembers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        requireStaff(authentication);
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số trang không hợp lệ.");
        }
        return userRepository.searchMembers(
                        query.trim(), PageRequest.of(page, Math.min(Math.max(size, 1), 50)))
                .map(user -> new ReceptionistMemberResponse(
                        user.getUserId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getStatus(),
                        user.getCreatedAt()));
    }

    @GetMapping("/check-ins")
    @Transactional(readOnly = true)
    public List<ReceptionistCheckInResponse> getRecentCheckIns(Authentication authentication) {
        requireStaff(authentication);
        List<MemberCheckIn> entries = checkInRepository.findTop50ByOrderByCheckedInAtDesc();
        Map<Long, User> members = userRepository.findAllById(
                        entries.stream().map(MemberCheckIn::getMemberId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        return entries.stream()
                .map(entry -> {
                    User member = members.get(entry.getMemberId());
                    return new ReceptionistCheckInResponse(
                            entry.getCheckInId(),
                            entry.getMemberId(),
                            member == null ? "Không rõ hội viên" : member.getFullName(),
                            member == null ? null : member.getPhone(),
                            entry.getCheckedInAt(),
                            entry.getResult());
                })
                .toList();
    }

    @PostMapping("/check-ins")
    @Transactional
    public ReceptionistCheckInResponse recordCheckIn(
            @RequestBody ReceptionistCheckInRequest request,
            Authentication authentication) {
        requireStaff(authentication);
        if (request == null || request.memberId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hội viên.");
        }
        User member = userRepository.findById(request.memberId())
                .filter(user -> "MEMBER".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        LocalDate today = LocalDate.now();
        boolean hasActiveMembership = membershipRepository.findByUserIdOrderByEndDateDesc(member.getUserId()).stream()
                .anyMatch(membership -> "ACTIVE".equalsIgnoreCase(membership.getStatus())
                        && (membership.getStartDate() == null || !membership.getStartDate().isAfter(today))
                        && (membership.getEndDate() == null || !membership.getEndDate().isBefore(today)));
        boolean isValid = "ACTIVE".equalsIgnoreCase(member.getStatus()) && hasActiveMembership;
        MemberCheckIn entry = new MemberCheckIn();
        entry.setMemberId(member.getUserId());
        entry.setCheckedInAt(LocalDateTime.now());
        entry.setResult(isValid ? "VALID" : "REJECTED");
        entry.setRecordedBy(actorId(authentication));
        MemberCheckIn saved = checkInRepository.save(entry);
        return new ReceptionistCheckInResponse(
                saved.getCheckInId(),
                member.getUserId(),
                member.getFullName(),
                member.getPhone(),
                saved.getCheckedInAt(),
                saved.getResult());
    }

    @PostMapping("/membership-sales")
    @Transactional
    public MemberPackagePurchaseResponse sellMembership(
            @RequestBody ReceptionistMembershipSaleRequest request,
            Authentication authentication) {
        requireStaff(authentication);
        if (request == null || request.memberId() == null || request.packageId() == null
                || request.paymentMethod() == null
                || !Set.of("CASH", "TRANSFER", "POS").contains(request.paymentMethod().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin thanh toán không hợp lệ.");
        }
        User member = userRepository.findById(request.memberId())
                .filter(user -> "MEMBER".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tài khoản hội viên hiện không hoạt động.");
        }
        MembershipPackage membershipPackage = packageRepository.findById(request.packageId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gói tập không còn được mở bán."));
        LocalDate today = LocalDate.now();
        UserMembership membership = new UserMembership();
        membership.setUserId(member.getUserId());
        membership.setPackageId(membershipPackage.getPackageId());
        membership.setStartDate(today);
        membership.setEndDate(today.plusDays(membershipPackage.getDurationDays()));
        membership.setStatus("PENDING_APPROVAL");
        UserMembership savedMembership = membershipRepository.save(membership);

        ReceptionPayment payment = new ReceptionPayment();
        payment.setMemberId(Math.toIntExact(member.getUserId()));
        payment.setMembershipId(Math.toIntExact(savedMembership.getMembershipId()));
        payment.setAmount(membershipPackage.getPrice());
        payment.setPaymentMethod(request.paymentMethod().toUpperCase(Locale.ROOT));
        payment.setPaymentStatus("COMPLETED");
        payment.setApprovedBy(Math.toIntExact(actorId(authentication)));
        payment.setCreatedAt(LocalDateTime.now());
        ReceptionPayment savedPayment = paymentRepository.save(payment);
        return new MemberPackagePurchaseResponse(
                savedPayment.getPaymentId().longValue(),
                savedMembership.getMembershipId(),
                membershipPackage.getName(),
                savedPayment.getAmount(),
                savedPayment.getPaymentStatus(),
                savedPayment.getCreatedAt());
    }

    @GetMapping("/report")
    @Transactional(readOnly = true)
    public ReceptionistReportResponse getDailyReport(
            @RequestParam(required = false) LocalDate date,
            Authentication authentication) {
        requireStaff(authentication);
        LocalDate reportDate = date == null ? LocalDate.now() : date;
        List<ReceptionPayment> payments = paymentRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay());
        List<PaymentEntry> allPayments = new ArrayList<>();
        payments.stream()
                .map(payment -> new PaymentEntry(
                        "membership-" + payment.getPaymentId(),
                        payment.getMemberId() == null ? null : payment.getMemberId().longValue(),
                        payment.getAmount(),
                        payment.getPaymentMethod(),
                        payment.getPaymentStatus(),
                        payment.getCreatedAt()))
                .forEach(allPayments::add);
        paymentTransactionRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay())
                .stream()
                .map(payment -> new PaymentEntry(
                        "booking-" + payment.getPaymentId(),
                        payment.getMemberId(),
                        payment.getAmount(),
                        payment.getPaymentMethod(),
                        payment.getPaymentStatus(),
                        payment.getCreatedAt()))
                .forEach(allPayments::add);

        List<PaymentEntry> completed = allPayments.stream()
                .filter(ReceptionistController::isCompleted)
                .toList();
        BigDecimal totalRevenue = completed.stream()
                .map(PaymentEntry::amount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, List<PaymentEntry>> byMethod = completed.stream()
                .collect(Collectors.groupingBy(
                        payment -> normalizeMethod(payment.method()),
                        TreeMap::new,
                        Collectors.toList()));
        List<ReceptionistReportResponse.PaymentMethodTotal> methodTotals = byMethod.entrySet().stream()
                .map(entry -> new ReceptionistReportResponse.PaymentMethodTotal(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(PaymentEntry::amount)
                                .filter(amount -> amount != null)
                                .reduce(BigDecimal.ZERO, BigDecimal::add),
                        entry.getValue().size()))
                .toList();

        List<Long> memberIds = allPayments.stream()
                .map(PaymentEntry::memberId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, User> members = userRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        List<ReceptionistReportResponse.PaymentRecord> records = allPayments.stream()
                .map(payment -> {
                    User member = payment.memberId() == null
                            ? null
                            : members.get(payment.memberId());
                    return new ReceptionistReportResponse.PaymentRecord(
                            payment.id(),
                            member == null ? "Không rõ hội viên" : member.getFullName(),
                            payment.amount(),
                            normalizeMethod(payment.method()),
                            payment.status(),
                            payment.createdAt());
                })
                .sorted((left, right) -> right.createdAt().compareTo(left.createdAt()))
                .toList();

        return new ReceptionistReportResponse(
                reportDate,
                totalRevenue,
                completed.size(),
                userRepository.countByRoleIgnoreCaseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        "MEMBER", reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay()),
                methodTotals,
                records);
    }

    @PostMapping("/users")
    @Transactional
    public ReceptionistMemberResponse createUser(
            @RequestBody CreateUserRequest request,
            Authentication authentication) {
        requireStaff(authentication);

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
        
        // Check email availability với logic theo status
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

        boolean isManager = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> List.of("ROLE_MANAGER", "ROLE_ADMIN").contains(authority.getAuthority()));
        if (!isManager) {
            // Lễ tân tạo ở trang quản trị: chỉ được chọn MEMBER, COACH hoặc RECEPTIONIST
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lễ tân chỉ có quyền tạo tài khoản Hội viên, Huấn luyện viên hoặc Lễ tân.");
            }
        } else {
            // Manager tạo ở trang quản trị: cả 4 vai trò
            if (!List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER", "ADMIN").contains(targetRole)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ.");
            }
        }

        // Rule: TẤT CẢ user được tạo qua Admin Panel đều phải đổi password lần đầu
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
        
        // Rule: LUÔN gửi email mật khẩu tạm khi tạo user qua Admin Panel
        try {
            emailService.sendTemporaryPasswordEmail(savedUser.getEmail(), savedUser.getFullName(), password, savedUser.getRole());
            auditLogService.logSuccess("CREATE_USER_ADMIN_PANEL", savedUser.getEmail(), savedUser.getUserId(), 
                    "User created via Admin Panel (Receptionist) | Role: " + savedUser.getRole() + " | RequirePasswordChange: true | Temporary password sent");
        } catch (Exception e) {
            auditLogService.logFailure("CREATE_USER_ADMIN_PANEL", 
                    savedUser.getEmail(), savedUser.getUserId(), 
                    "User created but email failed | Role: " + savedUser.getRole(), 
                    e.getMessage());
        }
        
        return new ReceptionistMemberResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getStatus(),
                savedUser.getCreatedAt());
    }

    private void requireStaff(Authentication authentication) {
        boolean isStaff = authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> List.of("ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_ADMIN").contains(role));
        if (!isStaff) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng lễ tân.");
        }
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            return "KHÁC";
        }
        return switch (method.trim().toUpperCase(Locale.ROOT)) {
            case "CASH" -> "TIỀN MẶT";
            case "POS", "CARD" -> "QUẸT THẺ POS";
            case "TRANSFER", "QR" -> "CHUYỂN KHOẢN / QR";
            case "ONLINE" -> "THANH TOÁN TRỰC TUYẾN";
            default -> method.trim();
        };
    }

    private static boolean isCompleted(PaymentEntry payment) {
        return "COMPLETED".equalsIgnoreCase(payment.status())
                || "PAID".equalsIgnoreCase(payment.status());
    }

    private record PaymentEntry(
            String id,
            Long memberId,
            BigDecimal amount,
            String method,
            String status,
            java.time.LocalDateTime createdAt) {
    }
}
