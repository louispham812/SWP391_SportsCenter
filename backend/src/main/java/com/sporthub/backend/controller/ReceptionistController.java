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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.Set;
import java.util.function.Function;
import java.util.ArrayList;
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

    public ReceptionistController(
            UserRepository userRepository,
            ReceptionPaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            MemberCheckInRepository checkInRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.checkInRepository = checkInRepository;
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
        membership.setStatus("ACTIVE");
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
