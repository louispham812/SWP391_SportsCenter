package com.sporthub.backend.controller;

import com.sporthub.backend.dto.ReceptionistMemberResponse;
import com.sporthub.backend.dto.MemberPackagePurchaseResponse;
import com.sporthub.backend.dto.ReceptionistMembershipSaleRequest;
import com.sporthub.backend.dto.ReceptionistCheckInRequest;
import com.sporthub.backend.dto.ReceptionistCheckInResponse;
import com.sporthub.backend.dto.ReceptionistReportResponse;
import com.sporthub.backend.entity.EquipmentLoan;
import com.sporthub.backend.entity.MemberCheckIn;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PaymentTransaction;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.crypto.password.PasswordEncoder;
import com.sporthub.backend.dto.CreateUserRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.util.CoachSportHelper;
import com.sporthub.backend.dto.ReceptionistProfileResponse;
import com.sporthub.backend.dto.ReceptionistProfileUpdateRequest;
import com.sporthub.backend.dto.ReceptionistDashboardOverviewResponse;

@RestController
@RequestMapping("/api/v1/receptionist")
@CrossOrigin(origins = "*")
public class ReceptionistController {

    @Autowired
    private com.sporthub.backend.service.CheckInService checkInService;

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
    private final com.sporthub.backend.service.PaymentService paymentService;

    @Autowired(required = false)
    private com.sporthub.backend.repository.EquipmentLoanRepository equipmentLoanRepository;
    @Autowired(required = false)
    private com.sporthub.backend.repository.BookingRepository bookingRepository;
    @Autowired(required = false)
    private com.sporthub.backend.service.EngagementService engagementService;
    @Autowired(required = false)
    private com.sporthub.backend.repository.ClassSessionRepository classSessionRepository;
    @Autowired(required = false)
    private com.sporthub.backend.repository.CourtBookingRepository courtBookingRepository;
    @Autowired(required = false)
    private SportRepository domainSportRepository;
    @Autowired(required = false)
    private com.sporthub.backend.service.BookingService bookingService;

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
            com.sporthub.backend.service.AuthService authService,
            com.sporthub.backend.service.PaymentService paymentService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.checkInRepository = checkInRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.authService = authService;
    }

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
        this(userRepository, paymentRepository, paymentTransactionRepository, membershipRepository, packageRepository, checkInRepository, passwordEncoder, emailService, auditLogService, authService, null);
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
        Page<User> usersPage = userRepository.searchMembers(
                query.trim(), PageRequest.of(page, Math.min(Math.max(size, 1), 50)));
        Map<Long, List<ReceptionistMemberResponse.ActivePackageSummary>> activePackagesByMember =
                loadActivePackageSummaries(usersPage.getContent());
        return usersPage.map(user -> {
            List<ReceptionistMemberResponse.ActivePackageSummary> summaries =
                    activePackagesByMember.getOrDefault(user.getUserId(), List.of());
            ReceptionistMemberResponse.ActivePackageSummary primary = summaries.isEmpty() ? null : summaries.get(0);
            int totalSessions = summaries.stream()
                    .map(ReceptionistMemberResponse.ActivePackageSummary::remainingQuotaSessions)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
            return new ReceptionistMemberResponse(
                    user.getUserId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getStatus(),
                    user.getCreatedAt(),
                    user.getEmergencyContactName(),
                    user.getEmergencyContactPhone(),
                    user.getAvatar(),
                    user.getRfidCode(),
                    primary != null ? primary.packageName() : null,
                    primary != null ? primary.endDate() : null,
                    totalSessions,
                    summaries);
        });
    }

    private Map<Long, List<ReceptionistMemberResponse.ActivePackageSummary>> loadActivePackageSummaries(List<User> users) {
        if (users == null || users.isEmpty() || membershipRepository == null) {
            return Map.of();
        }
        List<Long> memberIds = users.stream().map(User::getUserId).filter(Objects::nonNull).toList();
        if (memberIds.isEmpty()) {
            return Map.of();
        }
        LocalDate today = LocalDate.now();
        List<UserMembership> rawMemberships = membershipRepository.findByUserIdInOrderByEndDateDesc(memberIds);
        if (rawMemberships == null || rawMemberships.isEmpty()) {
            return Map.of();
        }
        List<UserMembership> active = rawMemberships.stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus())
                        && (m.getStartDate() == null || !m.getStartDate().isAfter(today))
                        && (m.getEndDate() == null || !m.getEndDate().isBefore(today)))
                .toList();
        if (active.isEmpty()) {
            return Map.of();
        }
        Set<Long> packageIds = active.stream()
                .map(UserMembership::getPackageId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, MembershipPackage> pkgMap = (packageRepository != null && !packageIds.isEmpty())
                ? packageRepository.findAllById(packageIds).stream()
                        .collect(Collectors.toMap(MembershipPackage::getPackageId, Function.identity(), (a, b) -> a))
                : Map.of();
        Map<Long, List<ReceptionistMemberResponse.ActivePackageSummary>> grouped = new LinkedHashMap<>();
        for (UserMembership m : active) {
            MembershipPackage pkg = pkgMap.get(m.getPackageId());
            String pkgName = pkg != null && pkg.getName() != null ? pkg.getName() : "Gói tập #" + m.getPackageId();
            Integer remainingSessions = m.getRemainingQuotaSessions() != null ? m.getRemainingQuotaSessions() : 0;
            Integer remainingCourts = m.getRemainingQuotaCourts() != null ? m.getRemainingQuotaCourts() : 0;
            grouped.computeIfAbsent(m.getUserId(), k -> new ArrayList<>())
                    .add(new ReceptionistMemberResponse.ActivePackageSummary(
                            m.getMembershipId(),
                            m.getPackageId(),
                            pkgName,
                            m.getStartDate(),
                            m.getEndDate(),
                            remainingSessions,
                            remainingCourts));
        }
        return grouped;
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

    // Keep the exception handler outside the service transaction: an ineligible
    // preview rolls back validation locks without marking a caller transaction rollback-only.
    @GetMapping("/check-in-eligibility")
    public Map<String, Object> checkInEligibility(@RequestParam Long memberId,
            @RequestParam(required = false) Long bookingId, Authentication authentication) {
        requireStaff(authentication);
        userRepository.findById(memberId)
                .filter(user -> "MEMBER".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        try {
            checkInService.validateCheckIn(memberId, bookingId);
            return Map.of("eligible", true, "reason", "Lịch trong khung giờ hiện tại đã được kiểm tra thanh toán hoặc quyền sử dụng gói.");
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode().value() != 409) throw exception;
            return Map.of("eligible", false, "reason", exception.getReason() == null
                    ? "Chưa đủ điều kiện check-in." : exception.getReason());
        }
    }

    @PostMapping({"/check-ins", "/check-in"})
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
        boolean isValid = "ACTIVE".equalsIgnoreCase(member.getStatus());
        if (isValid) checkInService.checkInBooking(member.getUserId(), request.bookingId());
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
                || !Set.of("CASH", "VNPAY").contains(request.paymentMethod().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin thanh toán không hợp lệ.");
        }
        User member = userRepository.findByIdForUpdate(request.memberId())
                .filter(user -> "MEMBER".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tài khoản hội viên hiện không hoạt động.");
        }
        MembershipPackage membershipPackage = packageRepository.findById(request.packageId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gói tập không còn được mở bán."));
        if (membershipRepository.existsByUserIdAndPackageIdAndStatusIn(member.getUserId(), request.packageId(),
                List.of("PENDING_PAYMENT", "PENDING", "PENDING_APPROVAL"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói tập này đang chờ thanh toán hoặc chờ duyệt.");
        }
        LocalDate today = LocalDate.now();
        UserMembership membership = new UserMembership();
        membership.setUserId(member.getUserId());
        membership.setPackageId(membershipPackage.getPackageId());
        membership.setStartDate(today);
        membership.setEndDate(today.plusDays(membershipPackage.getDurationDays()));
        membership.setStatus("PENDING_PAYMENT");
        UserMembership savedMembership = membershipRepository.save(membership);

        String method = request.paymentMethod().toUpperCase(Locale.ROOT);
        Long staffId = actorId(authentication);
        
        // Create PaymentTransaction (for VNPAY flow or CASH) with package name for history
        PaymentTransaction savedTransaction = paymentService.createPayment(
                member.getUserId(), 
                "MEMBERSHIP_PACKAGE",
                membershipPackage.getName(), // Store package name for transaction history
                membershipPackage.getPrice(), 
                method);
        savedTransaction.setMembershipId(savedMembership.getMembershipId());
        savedTransaction.setProcessedBy(staffId);
        if ("CASH".equals(method)) {
            savedTransaction.setPaymentStatus("PAID");
            savedTransaction.setPaymentCompletedAt(LocalDateTime.now());
        }
        paymentTransactionRepository.save(savedTransaction);
        if ("PAID".equals(savedTransaction.getPaymentStatus())) {
            savedMembership.setStatus("PENDING_APPROVAL");
            membershipRepository.save(savedMembership);
        }
        
        // Legacy ReceptionPayment for backward compatibility
        String receptionPaymentMethod = "VNPAY".equals(method) ? "ONLINE" : "CASH";
        boolean isInstantPaid = !"VNPAY".equals(method);
        
        ReceptionPayment payment = new ReceptionPayment();
        payment.setMemberId(Math.toIntExact(member.getUserId()));
        payment.setMembershipId(Math.toIntExact(savedMembership.getMembershipId()));
        payment.setAmount(membershipPackage.getPrice());
        payment.setPaymentMethod(receptionPaymentMethod);
        payment.setPaymentStatus(isInstantPaid ? "COMPLETED" : "PENDING");
        payment.setApprovedBy(Math.toIntExact(staffId));
        payment.setCreatedAt(LocalDateTime.now());
        ReceptionPayment savedPayment = paymentRepository.save(payment);
        
        return new MemberPackagePurchaseResponse(
                savedTransaction.getPaymentId(), // Use PaymentTransaction.paymentId for VNPay polling
                savedMembership.getMembershipId(),
                membershipPackage.getName(),
                savedPayment.getAmount(),
                savedTransaction.getPaymentStatus(), // PENDING for VNPAY, PAID for CASH
                savedPayment.getCreatedAt(),
                savedTransaction.getReferenceCode());
    }

    public ReceptionistReportResponse getDailyReport(
            LocalDate date,
            Authentication authentication) {
        return getDailyReport(date, null, null, null, authentication);
    }

    @GetMapping("/report")
    @Transactional(readOnly = true)
    public ReceptionistReportResponse getDailyReport(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication authentication) {
        requireStaff(authentication);
        String periodMode = period != null ? period.toLowerCase(Locale.ROOT).trim() : "day";
        LocalDate reportDate = date == null ? LocalDate.now() : date;
        LocalDateTime startOfDay;
        LocalDateTime endOfDay;
        LocalDate calculatedStart;
        LocalDate calculatedEnd;

        if (startDate != null && endDate != null) {
            calculatedStart = startDate;
            calculatedEnd = endDate;
            startOfDay = startDate.atStartOfDay();
            endOfDay = endDate.plusDays(1).atStartOfDay();
            periodMode = "custom";
        } else if ("month".equals(periodMode)) {
            calculatedStart = reportDate.withDayOfMonth(1);
            calculatedEnd = reportDate.withDayOfMonth(reportDate.lengthOfMonth());
            startOfDay = calculatedStart.atStartOfDay();
            endOfDay = calculatedEnd.plusDays(1).atStartOfDay();
        } else if ("year".equals(periodMode)) {
            calculatedStart = LocalDate.of(reportDate.getYear(), 1, 1);
            calculatedEnd = LocalDate.of(reportDate.getYear(), 12, 31);
            startOfDay = calculatedStart.atStartOfDay();
            endOfDay = calculatedEnd.plusDays(1).atStartOfDay();
        } else if ("all".equals(periodMode)) {
            calculatedStart = LocalDate.of(2020, 1, 1);
            calculatedEnd = LocalDate.now().plusYears(5);
            startOfDay = calculatedStart.atStartOfDay();
            endOfDay = calculatedEnd.atStartOfDay();
        } else {
            // "day"
            calculatedStart = reportDate;
            calculatedEnd = reportDate;
            startOfDay = reportDate.atStartOfDay();
            endOfDay = reportDate.plusDays(1).atStartOfDay();
            periodMode = "day";
        }

        boolean scopeToCurrentStaff = !isManagerOrAdmin(authentication);
        Long staffId = scopeToCurrentStaff ? actorId(authentication) : null;

        List<ReceptionPayment> rawPayments = scopeToCurrentStaff
                ? paymentRepository.findByApprovedByAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        Math.toIntExact(staffId), startOfDay, endOfDay)
                : paymentRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        startOfDay, endOfDay);
        List<ReceptionPayment> payments = rawPayments == null ? List.of() : rawPayments;

        List<PaymentTransaction> rawTransactions = scopeToCurrentStaff
                ? paymentTransactionRepository.findByProcessedByAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        staffId, startOfDay, endOfDay)
                : paymentTransactionRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        startOfDay, endOfDay);
        List<PaymentTransaction> transactions = rawTransactions == null ? List.of() : rawTransactions;

        List<PaymentEntry> allPayments = new ArrayList<>();
        Set<Integer> matchedPaymentIds = new HashSet<>();

        // 1. Process payment_transactions first (richer transaction data with reference codes)
        for (PaymentTransaction tx : transactions) {
            if ("MEMBERSHIP_QUOTA".equalsIgnoreCase(tx.getPaymentMethod())) {
                continue;
            }
            String id = tx.getReferenceCode() != null && !tx.getReferenceCode().isBlank()
                    ? tx.getReferenceCode()
                    : "trans-" + tx.getPaymentId();

            String type = tx.getItemType() != null && !tx.getItemType().isBlank()
                    ? tx.getItemType()
                    : (tx.getBookingType() != null ? tx.getBookingType() : "Dịch vụ");
            String desc = tx.getItemDescription() != null && !tx.getItemDescription().isBlank()
                    ? tx.getItemDescription()
                    : ("Thanh toán " + (tx.getBookingType() != null ? tx.getBookingType() : "dịch vụ"));

            allPayments.add(new PaymentEntry(
                    id,
                    tx.getMemberId(),
                    tx.getAmount(),
                    normalizeMethod(tx.getPaymentMethod()),
                    normalizeStatus(tx.getPaymentStatus()),
                    tx.getCreatedAt(),
                    null,
                    type,
                    desc,
                    tx.getProcessedBy()));

            // Find matching ReceptionPayment to prevent double counting
            for (ReceptionPayment rp : payments) {
                if (matchedPaymentIds.contains(rp.getPaymentId())) continue;
                if (matchesTransaction(rp, tx)) {
                    matchedPaymentIds.add(rp.getPaymentId());
                    break;
                }
            }
        }

        // 2. Add only ReceptionPayments that do NOT have a duplicate in payment_transactions (e.g. POS direct sales)
        for (ReceptionPayment rp : payments) {
            if (matchedPaymentIds.contains(rp.getPaymentId())) {
                continue; // Skip duplicate!
            }
            allPayments.add(new PaymentEntry(
                    "pos-" + rp.getPaymentId(),
                    rp.getMemberId() == null ? null : rp.getMemberId().longValue(),
                    rp.getAmount(),
                    normalizeMethod(rp.getPaymentMethod()),
                    normalizeStatus(rp.getPaymentStatus()),
                    rp.getCreatedAt(),
                    null,
                    "POS",
                    "Thanh toán gói tập / dịch vụ tại quầy",
                    rp.getApprovedBy() == null ? null : rp.getApprovedBy().longValue()));
        }

        // 3. Include paid equipment rentals collected on reportDate
        if (equipmentLoanRepository != null) {
            List<EquipmentLoan> returnedLoans = scopeToCurrentStaff
                    ? equipmentLoanRepository.findByStatusIgnoreCaseAndRecordedByAndReturnedAtGreaterThanEqualAndReturnedAtLessThanOrderByReturnedAtDesc(
                            "RETURNED", staffId, startOfDay, endOfDay)
                    : equipmentLoanRepository.findByStatusIgnoreCaseAndReturnedAtGreaterThanEqualAndReturnedAtLessThanOrderByReturnedAtDesc(
                            "RETURNED", startOfDay, endOfDay);
            if (returnedLoans != null) {
                for (EquipmentLoan loan : returnedLoans) {
                    if (loan.getReturnedAt() == null
                            || loan.getRentalFee() == null
                            || loan.getRentalFee().signum() <= 0) {
                        continue;
                    }
                    String method = loan.getPaymentMethod() == null || loan.getPaymentMethod().isBlank()
                            ? "CASH"
                            : loan.getPaymentMethod();
                    allPayments.add(new PaymentEntry(
                            "equip-" + loan.getLoanId(),
                            loan.getMemberId(),
                            loan.getRentalFee(),
                            normalizeMethod(method),
                            "Hoàn tất",
                            loan.getReturnedAt(),
                            loan.getMemberName(),
                            "EQUIPMENT",
                            "Thu phí thuê " + (loan.getItemName() != null ? loan.getItemName() : "dụng cụ") + " (SL: " + loan.getQuantity() + ")",
                            loan.getRecordedBy()));
                }
            }
        }

        List<PaymentEntry> completed = allPayments.stream()
                .filter(ReceptionistController::isCompleted)
                .toList();
        BigDecimal totalRevenue = completed.stream()
                .map(PaymentEntry::amount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, List<PaymentEntry>> byMethod = completed.stream()
                .collect(Collectors.groupingBy(
                        PaymentEntry::method,
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
        List<Long> staffIds = allPayments.stream()
                .map(PaymentEntry::processedBy)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, User> staffUsers = staffIds.isEmpty()
                ? Map.of()
                : Optional.ofNullable(userRepository.findAllById(staffIds)).orElse(List.of()).stream()
                        .collect(Collectors.toMap(User::getUserId, Function.identity(), (a, b) -> a));
        List<ReceptionistReportResponse.PaymentRecord> records = allPayments.stream()
                .map(payment -> {
                    User member = payment.memberId() == null
                            ? null
                            : members.get(payment.memberId());
                    String memberName = member != null
                            ? member.getFullName()
                            : (payment.fallbackMemberName() != null && !payment.fallbackMemberName().isBlank()
                                    ? payment.fallbackMemberName()
                                    : "Không rõ hội viên");
                    String phone = member != null ? member.getPhone() : null;
                    String email = member != null ? member.getEmail() : null;
                    User staffUser = payment.processedBy() == null ? null : staffUsers.get(payment.processedBy());
                    String processedByName = payment.processedBy() == null
                            ? "Tự thanh toán"
                            : (staffUser != null && staffUser.getFullName() != null && !staffUser.getFullName().isBlank()
                                    ? staffUser.getFullName()
                                    : "Nhân viên #" + payment.processedBy());
                    return new ReceptionistReportResponse.PaymentRecord(
                            payment.id(),
                            memberName,
                            payment.amount(),
                            payment.method(),
                            payment.status(),
                            payment.createdAt(),
                            phone,
                            email,
                            payment.type(),
                            payment.description(),
                            processedByName);
                })
                .sorted(java.util.Comparator.comparing(
                        ReceptionistReportResponse.PaymentRecord::createdAt,
                        java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                .toList();

        return new ReceptionistReportResponse(
                reportDate,
                totalRevenue,
                completed.size(),
                userRepository.countByRoleIgnoreCaseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        "MEMBER", startOfDay, endOfDay),
                methodTotals,
                records,
                periodMode,
                calculatedStart,
                calculatedEnd);
    }

    @GetMapping("/domain-sports")
    @Transactional(readOnly = true)
    public List<Sport> getDomainSports(Authentication authentication) {
        requireStaff(authentication);
        return domainSportRepository == null ? List.of() : domainSportRepository.findAllByOrderBySportIdAsc();
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
        if (!phone.matches("^[0-9]{10,15}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại phải gồm 10 đến 15 chữ số.");
        }
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 8 ký tự.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại này đã được sử dụng bởi tài khoản khác.");
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
            if (!"MEMBER".equals(targetRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Lễ tân chỉ được phép tạo tài khoản Hội viên (MEMBER).");
            }
        } else {
            // Manager tạo ở trang quản trị: chuẩn hóa ADMIN -> MANAGER
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
                savedUser.getCreatedAt(),
                savedUser.getEmergencyContactName(),
                savedUser.getEmergencyContactPhone(),
                savedUser.getAvatar(),
                savedUser.getRfidCode(),
                null,
                null,
                0,
                List.of());
    }

    public record ReceptionistClassEnrollRequest(
            Long memberId,
            String paymentMethod,
            Boolean useQuota,
            String voucherCode) {}

    @PostMapping("/classes/{sessionId}/enroll")
    @Transactional
    public com.sporthub.backend.dto.BookingConfirmationResponse enrollMemberInClass(
            @org.springframework.web.bind.annotation.PathVariable Long sessionId,
            @RequestBody ReceptionistClassEnrollRequest request,
            Authentication authentication) {
        requireStaff(authentication);
        if (bookingService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ đặt lớp chưa sẵn sàng.");
        }
        if (request == null || request.memberId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hội viên cần đăng ký.");
        }
        return bookingService.enrollMemberInClassByReceptionist(
                sessionId,
                request.memberId(),
                request.paymentMethod(),
                request.useQuota(),
                request.voucherCode(),
                actorId(authentication),
                actorRole(authentication));
    }

    @org.springframework.web.bind.annotation.DeleteMapping({"/classes/bookings/{bookingId}", "/bookings/{bookingId}"})
    @Transactional
    public com.sporthub.backend.dto.CancelBookingResponse cancelMemberClassBooking(
            @org.springframework.web.bind.annotation.PathVariable Long bookingId,
            Authentication authentication) {
        requireStaff(authentication);
        if (bookingService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ đặt lớp chưa sẵn sàng.");
        }
        return bookingService.cancelClassBookingByStaff(
                bookingId, actorId(authentication), actorRole(authentication));
    }

    public record AvatarUpdateRequest(String avatar) {}
    public record RfidUpdateRequest(String rfidCode) {}

    /**
     * REC-03: Cập nhật ảnh nhận diện hội viên tại quầy.
     */
    @org.springframework.web.bind.annotation.PutMapping("/members/{memberId}/avatar")
    @Transactional
    public Map<String, Object> updateMemberAvatar(
            @org.springframework.web.bind.annotation.PathVariable Long memberId,
            @RequestBody AvatarUpdateRequest req,
            Authentication auth) {
        requireStaff(auth);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (req == null || req.avatar() == null || req.avatar().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu ảnh nhận diện không hợp lệ.");
        }
        user.setAvatar(req.avatar());
        userRepository.save(user);
        if (engagementService != null) {
            engagementService.audit(actorId(auth), "RECEPTIONIST", "UPDATE_MEMBER_AVATAR",
                    "memberId=" + memberId + ", name=" + user.getFullName());
        }
        return Map.of("ok", true, "avatar", user.getAvatar());
    }

    /**
     * REC-08: Cấp phát thẻ từ RFID cho hội viên.
     */
    @org.springframework.web.bind.annotation.PutMapping("/members/{memberId}/rfid")
    @Transactional
    public Map<String, Object> updateMemberRfid(
            @org.springframework.web.bind.annotation.PathVariable Long memberId,
            @RequestBody RfidUpdateRequest req,
            Authentication auth) {
        requireStaff(auth);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (req == null || req.rfidCode() == null || req.rfidCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã thẻ từ RFID không được để trống.");
        }
        String rfid = req.rfidCode().trim();
        if (userRepository.existsByRfidCodeAndUserIdNot(rfid, memberId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã thẻ từ RFID này đã được cấp cho hội viên khác.");
        }
        user.setRfidCode(rfid);
        userRepository.save(user);
        if (engagementService != null) {
            engagementService.audit(actorId(auth), "RECEPTIONIST", "ASSIGN_RFID_CARD",
                    "memberId=" + memberId + ", rfid=" + rfid + ", name=" + user.getFullName());
        }
        return Map.of("ok", true, "rfidCode", rfid);
    }

    public record EmergencyContactRequest(String emergencyContactName, String emergencyContactPhone) {}

    /**
     * REC-09: Cập nhật liên hệ khẩn cấp của hội viên tại quầy.
     */
    @org.springframework.web.bind.annotation.PutMapping("/members/{memberId}/emergency-contact")
    @Transactional
    public Map<String, Object> updateMemberEmergencyContact(
            @org.springframework.web.bind.annotation.PathVariable Long memberId,
            @RequestBody EmergencyContactRequest req,
            Authentication auth) {
        requireStaff(auth);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
        if (req != null) {
            user.setEmergencyContactName(req.emergencyContactName() != null ? req.emergencyContactName().trim() : null);
            user.setEmergencyContactPhone(req.emergencyContactPhone() != null ? req.emergencyContactPhone().trim() : null);
        }
        userRepository.save(user);
        if (engagementService != null) {
            engagementService.audit(actorId(auth), "RECEPTIONIST", "UPDATE_MEMBER_EMERGENCY_CONTACT",
                    "memberId=" + memberId + ", name=" + user.getFullName());
        }
        return Map.of(
                "ok", true,
                "emergencyContactName", user.getEmergencyContactName() != null ? user.getEmergencyContactName() : "",
                "emergencyContactPhone", user.getEmergencyContactPhone() != null ? user.getEmergencyContactPhone() : ""
        );
    }

    /**
     * REC-08: Quét mã QR cá nhân / thẻ từ RFID / SĐT để tra cứu hồ sơ và gói dịch vụ.
     */
    @GetMapping("/lookup-card")
    @Transactional
    public Map<String, Object> lookupCard(@RequestParam String code, Authentication auth) {
        requireStaff(auth);
        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mã thẻ từ, QR hoặc số điện thoại.");
        }
        String query = code.trim();
        User user = null;
        if (query.toUpperCase(Locale.ROOT).startsWith("SPORTHUB-MEMBER-")) {
            try {
                Long id = Long.parseLong(query.substring("SPORTHUB-MEMBER-".length()));
                user = userRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (user == null) {
            user = userRepository.findByRfidCode(query).orElse(null);
        }
        if (user == null) {
            user = userRepository.findByPhone(query).orElse(null);
        }
        if (user == null) {
            try {
                Long id = Long.parseLong(query);
                user = userRepository.findById(id).filter(u -> "MEMBER".equalsIgnoreCase(u.getRole())).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên khớp với mã \"" + query + "\".");
        }

        LocalDate today = LocalDate.now();
        Long uid = user.getUserId();

        // Tự động chuyển gói quá hạn sang EXPIRED
        List<UserMembership> allM = membershipRepository.findByUserIdOrderByEndDateDesc(uid);
        for (UserMembership m : allM) {
            if ("ACTIVE".equalsIgnoreCase(m.getStatus()) && m.getEndDate() != null && m.getEndDate().isBefore(today)) {
                m.setStatus("EXPIRED");
                membershipRepository.save(m);
            }
        }

        List<UserMembership> activeList = membershipRepository.findByUserIdOrderByEndDateDesc(uid).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus())
                        && m.getStartDate() != null && !m.getStartDate().isAfter(today)
                        && m.getEndDate() != null && !m.getEndDate().isBefore(today))
                .toList();

        List<MembershipPackage> resolvedPackages = new ArrayList<>();
        List<Map<String, Object>> activePackages = new ArrayList<>();
        for (UserMembership m : activeList) {
            MembershipPackage pkg = packageRepository.findById(m.getPackageId()).orElse(null);
            String pkgName = pkg != null ? pkg.getName() : "Gói tập";
            if (pkg != null) resolvedPackages.add(pkg);
            long daysLeft = m.getEndDate() != null ? Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(today, m.getEndDate()) + 1) : 0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("membershipId", m.getMembershipId());
            row.put("packageName", pkgName);
            row.put("startDate", m.getStartDate());
            row.put("endDate", m.getEndDate());
            row.put("daysRemaining", daysLeft);
            if (pkg != null && pkg.getQuotaSessions() != null && pkg.getQuotaSessions() > 0) {
                row.put("remainingSessions", m.getRemainingQuotaSessions());
                row.put("heldSessions", m.getHeldQuotaSessions());
                row.put("usedSessions", m.getUsedQuotaSessions());
            }
            if (pkg != null && pkg.getQuotaCourts() != null && pkg.getQuotaCourts() > 0) {
                row.put("remainingCourtHours", m.getRemainingQuotaCourts());
                row.put("heldCourtHours", m.getHeldQuotaCourts());
                row.put("usedCourtHours", m.getUsedQuotaCourts());
            }
            activePackages.add(row);
        }

        // Today Bookings
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.plusDays(1).atStartOfDay();
        List<Map<String, Object>> todayBookings = new ArrayList<>();
        if (bookingRepository != null) {
            for (com.sporthub.backend.entity.Booking b : bookingRepository.findByMemberId(uid)) {
                if ("CANCELLED".equalsIgnoreCase(b.getStatus())) continue;
                if (b.getSessionId() != null && classSessionRepository != null) {
                    com.sporthub.backend.entity.ClassSession s = classSessionRepository.findById(b.getSessionId()).orElse(null);
                    if (s != null && s.getStartTime() != null
                            && !s.getStartTime().isBefore(startOfToday) && s.getStartTime().isBefore(endOfToday)) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("bookingId", b.getBookingId());
                        row.put("sessionId", s.getSessionId());
                        row.put("title", s.getClassName());
                        row.put("startTime", s.getStartTime());
                        row.put("endTime", s.getEndTime());
                        row.put("status", b.getStatus());
                        row.put("attendanceStatus", b.getAttendanceStatus());
                        row.put("usesMembershipQuota", b.getUsesMembershipQuota());
                        todayBookings.add(row);
                    }
                }
            }
        }

        if (courtBookingRepository != null) {
            for (com.sporthub.backend.entity.CourtBooking b : courtBookingRepository.findByMemberIdOrderByStartTimeAsc(uid)) {
                if (b.getStartTime().toLocalDate().equals(today) && !"CANCELLED".equals(b.getStatus())) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("bookingId", b.getCourtBookingId()); row.put("bookingType", "COURT");
                    row.put("courtName", "Sân #" + b.getCourtId()); row.put("startTime", b.getStartTime()); row.put("endTime", b.getEndTime());
                    row.put("usesMembershipQuota", b.getUsesMembershipQuota());
                    row.put("status", b.getStatus()); todayBookings.add(row);
                }
            }
        }
        var tierDisplay = com.sporthub.backend.enums.MembershipTier.resolveDisplay(
                resolvedPackages, "MEMBER", "HỘI VIÊN MỚI");
        String tier = tierDisplay.tier();
        String tierBadge = tierDisplay.tierBadge();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getUserId());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("avatar", user.getAvatar());
        result.put("rfidCode", user.getRfidCode());
        result.put("qrToken", "SPORTHUB-MEMBER-" + user.getUserId());
        result.put("tier", tier);
        result.put("tierBadge", tierBadge);
        result.put("status", user.getStatus());
        result.put("activePackages", activePackages);
        result.put("todayBookings", todayBookings);
        return result;
    }

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ReceptionistProfileResponse getMyProfile(Authentication auth) {
        requireStaff(auth);
        Long id = actorId(auth);
        User staff = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin nhân viên lễ tân."));

        long checkInsHandled = checkInRepository != null ? checkInRepository.countByRecordedBy(id) : 0;
        List<ReceptionPayment> myPayments = paymentRepository != null
                ? Optional.ofNullable(paymentRepository.findByApprovedBy(Math.toIntExact(id))).orElse(List.of()).stream()
                        .filter(p -> isCompletedPaymentStatus(p.getPaymentStatus()))
                        .toList()
                : List.of();
        List<PaymentTransaction> myTransactions = paymentTransactionRepository != null
                ? Optional.ofNullable(paymentTransactionRepository.findByProcessedBy(id)).orElse(List.of()).stream()
                        .filter(tx -> !"MEMBERSHIP_QUOTA".equalsIgnoreCase(tx.getPaymentMethod()))
                        .filter(tx -> isCompletedPaymentStatus(tx.getPaymentStatus()))
                        .toList()
                : List.of();
        Set<Integer> matchedLegacyIds = new HashSet<>();
        for (PaymentTransaction tx : myTransactions) {
            for (ReceptionPayment rp : myPayments) {
                if (matchedLegacyIds.contains(rp.getPaymentId())) continue;
                if (matchesTransaction(rp, tx)) {
                    matchedLegacyIds.add(rp.getPaymentId());
                    break;
                }
            }
        }
        List<ReceptionPayment> unmatchedPayments = myPayments.stream()
                .filter(rp -> !matchedLegacyIds.contains(rp.getPaymentId()))
                .toList();
        List<EquipmentLoan> myEquipmentLoans = equipmentLoanRepository != null
                ? equipmentLoanRepository.findByStatusIgnoreCaseOrderByLoanedAtDesc("RETURNED").stream()
                        .filter(loan -> Objects.equals(loan.getRecordedBy(), id)
                                && loan.getRentalFee() != null
                                && loan.getRentalFee().signum() > 0)
                        .toList()
                : List.of();
        long salesHandled = (long) myTransactions.size() + unmatchedPayments.size() + myEquipmentLoans.size();
        BigDecimal totalRevenueCollected = myTransactions.stream()
                .map(PaymentTransaction::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(unmatchedPayments.stream()
                        .map(ReceptionPayment::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .add(myEquipmentLoans.stream()
                        .map(EquipmentLoan::getRentalFee)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

        String staffCode = "F-STAFF-" + String.format("%03d", staff.getUserId());
        return new ReceptionistProfileResponse(
                staff.getUserId(),
                staff.getFullName(),
                staff.getEmail(),
                staff.getPhone(),
                staff.getAvatar(),
                staff.getRfidCode(),
                staffCode,
                staff.getDateOfBirth(),
                staff.getGender(),
                staff.getAddress(),
                staff.getEmergencyContactName(),
                staff.getEmergencyContactPhone(),
                staff.getRole(),
                "Nhân viên Lễ tân",
                staff.getStatus(),
                staff.getCreatedAt(),
                new ReceptionistProfileResponse.StaffStats(checkInsHandled, salesHandled, totalRevenueCollected)
        );
    }

    @PutMapping("/profile")
    @Transactional
    public ReceptionistProfileResponse updateMyProfile(
            @RequestBody ReceptionistProfileUpdateRequest req,
            Authentication auth) {
        requireStaff(auth);
        Long id = actorId(auth);
        User staff = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin nhân viên lễ tân."));

        if (req != null) {
            if (req.fullName() != null && !req.fullName().isBlank()) {
                if (req.fullName().trim().length() > 100) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên vượt quá 100 ký tự.");
                }
                staff.setFullName(req.fullName().trim());
            }
            if (req.phone() != null) {
                if (req.phone().trim().length() > 15) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại vượt quá 15 ký tự.");
                }
                staff.setPhone(req.phone().trim());
            }
            staff.setDateOfBirth(req.dateOfBirth());
            if (req.gender() != null) {
                staff.setGender(req.gender().trim());
            }
            if (req.address() != null) {
                staff.setAddress(req.address().trim());
            }
            if (req.emergencyContactName() != null) {
                staff.setEmergencyContactName(req.emergencyContactName().trim());
            }
            if (req.emergencyContactPhone() != null) {
                staff.setEmergencyContactPhone(req.emergencyContactPhone().trim());
            }
        }
        userRepository.save(staff);
        return getMyProfile(auth);
    }

    @PutMapping("/avatar")
    @Transactional
    public Map<String, Object> updateMyAvatar(
            @RequestBody AvatarUpdateRequest req,
            Authentication auth) {
        requireStaff(auth);
        Long id = actorId(auth);
        User staff = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin nhân viên lễ tân."));

        if (req == null || req.avatar() == null || req.avatar().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu ảnh đại diện không hợp lệ.");
        }
        staff.setAvatar(req.avatar().trim());
        userRepository.save(staff);
        return Map.of("ok", true, "avatar", staff.getAvatar());
    }

    @GetMapping("/dashboard-overview")
    @Transactional(readOnly = true)
    public ReceptionistDashboardOverviewResponse getDashboardOverview(Authentication auth) {
        requireStaff(auth);
        LocalDate today = LocalDate.now();
        ReceptionistReportResponse report = getDailyReport(today, auth);

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        long todayCheckIns = checkInRepository != null
                ? checkInRepository.countByCheckedInAtGreaterThanEqualAndCheckedInAtLessThan(startOfDay, endOfDay)
                : 0;
        long validCheckIns = checkInRepository != null
                ? checkInRepository.countByResultAndCheckedInAtGreaterThanEqualAndCheckedInAtLessThan("VALID", startOfDay, endOfDay)
                : 0;
        long rejectedCheckIns = checkInRepository != null
                ? checkInRepository.countByResultAndCheckedInAtGreaterThanEqualAndCheckedInAtLessThan("REJECTED", startOfDay, endOfDay)
                : 0;

        long activeLoans = 0;
        if (equipmentLoanRepository != null) {
            activeLoans = equipmentLoanRepository.findByStatusIgnoreCaseOrderByLoanedAtDesc("BORROWED").size()
                    + equipmentLoanRepository.findByStatusIgnoreCaseOrderByLoanedAtDesc("OVERDUE").size();
        }

        // Recent check-ins list (top 8)
        List<ReceptionistDashboardOverviewResponse.RecentCheckInItem> recentCheckIns = new ArrayList<>();
        if (checkInRepository != null) {
            List<MemberCheckIn> entries = checkInRepository.findTop50ByOrderByCheckedInAtDesc();
            List<MemberCheckIn> top8 = entries.stream().limit(8).toList();
            Set<Long> memberIds = top8.stream().map(MemberCheckIn::getMemberId).collect(Collectors.toSet());
            Map<Long, User> memberMap = userRepository.findAllById(memberIds).stream()
                    .collect(Collectors.toMap(User::getUserId, Function.identity()));

            for (MemberCheckIn e : top8) {
                User m = memberMap.get(e.getMemberId());
                recentCheckIns.add(new ReceptionistDashboardOverviewResponse.RecentCheckInItem(
                        e.getCheckInId(),
                        e.getMemberId(),
                        m != null ? m.getFullName() : "Hội viên #" + e.getMemberId(),
                        m != null ? m.getPhone() : null,
                        m != null ? m.getAvatar() : null,
                        e.getCheckedInAt(),
                        e.getResult()
                ));
            }
        }

        // Today's classes
        List<ReceptionistDashboardOverviewResponse.TodayClassItem> todayClasses = new ArrayList<>();
        if (classSessionRepository != null) {
            List<ClassSession> sessions = classSessionRepository
                    .findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(startOfDay, endOfDay).stream()
                    .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                    .toList();
            Set<Long> coachIds = sessions.stream().map(ClassSession::getCoachId).collect(Collectors.toSet());
            Map<Long, User> coachMap = userRepository.findAllById(coachIds).stream()
                    .collect(Collectors.toMap(User::getUserId, Function.identity()));

            for (ClassSession s : sessions) {
                User c = coachMap.get(s.getCoachId());
                todayClasses.add(new ReceptionistDashboardOverviewResponse.TodayClassItem(
                        s.getSessionId(),
                        s.getClassName(),
                        s.getCoachId(),
                        c != null ? c.getFullName() : "HLV #" + s.getCoachId(),
                        c != null ? c.getAvatar() : null,
                        s.getStartTime(),
                        s.getEndTime(),
                        s.getMaxSlots(),
                        s.getBookedSlots(),
                        s.getStatus()
                ));
            }
        }

        return new ReceptionistDashboardOverviewResponse(
                today,
                report.totalRevenue(),
                report.completedPayments(),
                todayCheckIns,
                validCheckIns,
                rejectedCheckIns,
                report.newMembers(),
                todayClasses.size(),
                activeLoans,
                recentCheckIns,
                todayClasses,
                report.paymentMethods()
        );
    }

    private void requireStaff(Authentication authentication) {
        boolean isStaff = authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> List.of("ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_ADMIN").contains(role));
        if (!isStaff) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng lễ tân.");
        }
    }

    private boolean isManagerOrAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(role -> List.of("ROLE_MANAGER", "ROLE_ADMIN").contains(role));
    }

    public static boolean matchesTransaction(ReceptionPayment rp, PaymentTransaction tx) {
        if (rp == null || tx == null) {
            return false;
        }
        boolean sameMember = rp.getMemberId() != null && Objects.equals(rp.getMemberId().longValue(), tx.getMemberId());
        boolean sameAmount = rp.getAmount() != null && tx.getAmount() != null
                && rp.getAmount().compareTo(tx.getAmount()) == 0;
        boolean nearTime = rp.getCreatedAt() != null && tx.getCreatedAt() != null
                && java.time.Duration.between(rp.getCreatedAt(), tx.getCreatedAt()).abs().toMinutes() <= 10;
        boolean sameMembership = tx.getMembershipId() != null && rp.getMembershipId() != null
                && tx.getMembershipId().longValue() == rp.getMembershipId().longValue();
        return sameMember && (sameMembership || (tx.getMembershipId() == null && sameAmount && nearTime));
    }

    public static boolean isCompletedPaymentStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return "COMPLETED".equals(normalized) || "PAID".equals(normalized) || "SUCCESS".equals(normalized);
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String actorRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "";
        }
        return authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a != null && a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()).toUpperCase(Locale.ROOT))
                .findFirst()
                .orElse("");
    }

    private String normalizeMethod(String method) {
        if (method == null || method.isBlank()) {
            return "Khác";
        }
        return switch (method.trim().toUpperCase(Locale.ROOT)) {
            case "CASH", "CASH_COUNTER", "TIỀN MẶT" -> "Tiền mặt";
            case "ONLINE", "VNPAY", "MOMO" -> "Thanh toán trực tuyến VNPay";
            default -> method.trim();
        };
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Chờ xử lý";
        }
        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "COMPLETED", "PAID", "SUCCESS", "HOÀN TẤT" -> "Hoàn tất";
            case "PENDING", "PENDING_PAYMENT", "WAITING", "CHỜ THANH TOÁN" -> "Chờ thanh toán";
            case "FAILED", "ERROR", "REJECTED", "THẤT BẠI" -> "Thất bại";
            case "CANCELLED", "CANCELED", "ĐÃ HỦY" -> "Đã hủy";
            case "REFUNDED", "ĐÃ HOÀN TIỀN" -> "Đã hoàn tiền";
            default -> status.trim();
        };
    }

    private static boolean isCompleted(PaymentEntry payment) {
        return "Hoàn tất".equalsIgnoreCase(payment.status())
                || "COMPLETED".equalsIgnoreCase(payment.status())
                || "PAID".equalsIgnoreCase(payment.status());
    }

    private record PaymentEntry(
            String id,
            Long memberId,
            BigDecimal amount,
            String method,
            String status,
            java.time.LocalDateTime createdAt,
            String fallbackMemberName,
            String type,
            String description,
            Long processedBy) {
        private PaymentEntry(
                String id,
                Long memberId,
                BigDecimal amount,
                String method,
                String status,
                java.time.LocalDateTime createdAt,
                String fallbackMemberName,
                String type,
                String description) {
            this(id, memberId, amount, method, status, createdAt, fallbackMemberName, type, description, null);
        }
        private PaymentEntry(
                String id,
                Long memberId,
                BigDecimal amount,
                String method,
                String status,
                java.time.LocalDateTime createdAt,
                String fallbackMemberName) {
            this(id, memberId, amount, method, status, createdAt, fallbackMemberName, "Dịch vụ", "Thanh toán dịch vụ", null);
        }
        private PaymentEntry(
                String id,
                Long memberId,
                BigDecimal amount,
                String method,
                String status,
                java.time.LocalDateTime createdAt) {
            this(id, memberId, amount, method, status, createdAt, null, "Dịch vụ", "Thanh toán dịch vụ", null);
        }
    }
}
