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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.Set;
import java.util.function.Function;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Objects;
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
    private final com.sporthub.backend.repository.BookingRepository bookingRepository;
    private final com.sporthub.backend.service.EngagementService engagementService;
    private final com.sporthub.backend.repository.ClassSessionRepository classSessionRepository;
    private final com.sporthub.backend.repository.CourtBookingRepository courtBookingRepository;

    @Autowired
    public ReceptionistController(
            UserRepository userRepository,
            ReceptionPaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            MemberCheckInRepository checkInRepository,
            PasswordEncoder passwordEncoder,
            com.sporthub.backend.repository.BookingRepository bookingRepository,
            com.sporthub.backend.service.EngagementService engagementService,
            com.sporthub.backend.repository.ClassSessionRepository classSessionRepository,
            com.sporthub.backend.repository.CourtBookingRepository courtBookingRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.checkInRepository = checkInRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingRepository = bookingRepository;
        this.engagementService = engagementService;
        this.classSessionRepository = classSessionRepository;
        this.courtBookingRepository = courtBookingRepository;
    }

    public ReceptionistController(
            UserRepository userRepository,
            ReceptionPaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            MemberCheckInRepository checkInRepository) {
        this(userRepository, paymentRepository, paymentTransactionRepository,
             membershipRepository, packageRepository, checkInRepository, new BCryptPasswordEncoder(), null, null, null, null);
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

        // Anti-double check-in (BR-09 / Flow 4): Chặn check-in trùng lặp trong vòng 5 phút
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        if (checkInRepository.existsByMemberIdAndCheckedInAtAfter(member.getUserId(), fiveMinutesAgo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hội viên vừa mới check-in trong vòng 5 phút qua. Không cần quét lại.");
        }

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

        // Kiểm tra xem khách có gói cùng bộ môn đang còn hạn không để nối tiếp ngày (REC-06 / MEM-09)
        List<UserMembership> existingActive = membershipRepository.findByUserIdOrderByEndDateDesc(member.getUserId()).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && m.getEndDate() != null && !m.getEndDate().isBefore(today))
                .filter(m -> packageRepository.findById(m.getPackageId())
                        .map(p -> java.util.Objects.equals(p.getSportId(), membershipPackage.getSportId()))
                        .orElse(false))
                .toList();

        LocalDate startDate = today;
        if (!existingActive.isEmpty()) {
            UserMembership currentMembership = existingActive.get(0);
            MembershipPackage currentPackage = packageRepository.findById(currentMembership.getPackageId()).orElse(null);
            if (currentPackage != null) {
                if (membershipPackage.getPackageId().equals(currentPackage.getPackageId())) {
                    // Gia hạn cùng gói: nối tiếp ngày
                    LocalDate maxEnd = currentMembership.getEndDate();
                    if (maxEnd != null && !maxEnd.isBefore(today)) {
                        startDate = maxEnd.plusDays(1);
                    }
                } else if (membershipPackage.getPrice().compareTo(currentPackage.getPrice()) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Hội viên đang sử dụng gói " + currentPackage.getName() + ". Không thể mua gói thấp hơn gói hiện tại.");
                } else {
                    // Nâng cấp lên gói cao hơn: hết hạn gói cũ hôm nay, kích hoạt gói mới ngay lập tức
                    currentMembership.setStatus("EXPIRED");
                    membershipRepository.save(currentMembership);
                    startDate = today;
                }
            }
        }
        LocalDate endDate = startDate.plusDays(Math.max(1, membershipPackage.getDurationDays()) - 1);

        UserMembership membership = new UserMembership();
        membership.setUserId(member.getUserId());
        membership.setPackageId(membershipPackage.getPackageId());
        membership.setStartDate(startDate);
        membership.setEndDate(endDate);
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
        Set<Long> cancelledCourtPaymentIds = courtBookingRepository != null
                ? courtBookingRepository.findAll().stream()
                        .filter(cb -> "CANCELLED".equalsIgnoreCase(cb.getStatus()))
                        .map(com.sporthub.backend.entity.CourtBooking::getPaymentId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
                : Set.of();

        Set<Long> cancelledClassPaymentIds = bookingRepository != null
                ? bookingRepository.findAll().stream()
                        .filter(b -> "CANCELLED".equalsIgnoreCase(b.getStatus()))
                        .map(com.sporthub.backend.entity.Booking::getPaymentId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet())
                : Set.of();

        paymentTransactionRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay())
                .stream()
                .filter(payment -> payment.getBookingType() == null || !payment.getBookingType().toUpperCase().endsWith("_REFUND"))
                .map(payment -> {
                    String effStatus = payment.getPaymentStatus();
                    if (cancelledCourtPaymentIds.contains(payment.getPaymentId())
                            || cancelledClassPaymentIds.contains(payment.getPaymentId())) {
                        effStatus = "REFUNDED";
                    }
                    return new PaymentEntry(
                            "booking-" + payment.getPaymentId(),
                            payment.getMemberId(),
                            payment.getAmount(),
                            payment.getPaymentMethod(),
                            effStatus,
                            payment.getCreatedAt());
                })
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
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã tồn tại trong hệ thống.");
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
        return new ReceptionistMemberResponse(
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getStatus(),
                savedUser.getCreatedAt());
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
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && (m.getEndDate() == null || !m.getEndDate().isBefore(today)))
                .toList();

        String tier = "MEMBER";
        List<Map<String, Object>> activePackages = new ArrayList<>();
        for (UserMembership m : activeList) {
            MembershipPackage pkg = packageRepository.findById(m.getPackageId()).orElse(null);
            String pkgName = pkg != null ? pkg.getName() : "Gói tập";
            if (pkgName.toUpperCase(Locale.ROOT).contains("VIP") || pkgName.toUpperCase(Locale.ROOT).contains("DIAMOND")
                    || (pkg != null && "ALL_ACCESS".equalsIgnoreCase(pkg.getAccessType()))) {
                tier = "VIP";
            } else if ("MEMBER".equals(tier)) {
                tier = "STANDARD";
            }
            long daysLeft = m.getEndDate() != null ? Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(today, m.getEndDate()) + 1) : 0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("membershipId", m.getMembershipId());
            row.put("packageName", pkgName);
            row.put("startDate", m.getStartDate());
            row.put("endDate", m.getEndDate());
            row.put("daysRemaining", daysLeft);
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
                        todayBookings.add(row);
                    }
                }
            }
        }

        String tierBadge = "VIP".equals(tier) ? "HỘI VIÊN VIP" : "STANDARD".equals(tier) ? "HỘI VIÊN STANDARD" : "HỘI VIÊN MỚI";
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
        if (payment == null || payment.status() == null) return false;
        if ("REFUNDED".equalsIgnoreCase(payment.status()) || "CANCELLED".equalsIgnoreCase(payment.status())) {
            return false;
        }
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
