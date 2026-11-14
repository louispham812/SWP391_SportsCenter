package com.sporthub.backend.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.dto.AvatarUpdateRequest;
import com.sporthub.backend.dto.MemberAttendanceRecordResponse;
import com.sporthub.backend.dto.MemberAttendanceSummaryResponse;
import com.sporthub.backend.dto.MemberCheckInResponse;
import com.sporthub.backend.dto.MemberHealthProfileRequest;
import com.sporthub.backend.dto.MemberMembershipResponse;
import com.sporthub.backend.dto.MemberNotificationResponse;
import com.sporthub.backend.dto.MemberPackagePurchaseRequest;
import com.sporthub.backend.dto.MemberPackagePurchaseResponse;
import com.sporthub.backend.dto.MemberProfileRequest;
import com.sporthub.backend.dto.MemberProfileResponse;
import com.sporthub.backend.dto.MemberTransactionResponse;
import com.sporthub.backend.dto.MembershipQuotaResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.MemberHealthProfile;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.MemberHealthProfileRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.PaymentService;

@RestController
@RequestMapping("/api/v1/members/me")
@CrossOrigin(origins = "*")
public class MemberProfileController {

    private final UserRepository userRepository;
    private final MemberHealthProfileRepository healthRepository;
    private final UserMembershipRepository membershipRepository;
    private final MembershipPackageRepository packageRepository;
    private final ReceptionPaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookingRepository bookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final MemberCheckInRepository memberCheckInRepository;
    private final PublicSportRepository publicSportRepository;
    private final PaymentService paymentService;
    @Autowired private com.sporthub.backend.service.MembershipService entitlementService;
    @Autowired private com.sporthub.backend.service.VoucherService voucherService;

    public MemberProfileController(
            UserRepository userRepository,
            MemberHealthProfileRepository healthRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            ReceptionPaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            MemberCheckInRepository memberCheckInRepository,
            PublicSportRepository publicSportRepository,
            PaymentService paymentService) {
        this.userRepository = userRepository;
        this.healthRepository = healthRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.memberCheckInRepository = memberCheckInRepository;
        this.publicSportRepository = publicSportRepository;
        this.paymentService = paymentService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public MemberProfileResponse getProfile(Authentication authentication) {
        return toProfileResponse(findMember(memberId(authentication)));
    }

    @PutMapping
    @Transactional
    public MemberProfileResponse updateProfile(
            @RequestBody MemberProfileRequest request,
            Authentication authentication) {
        if (request.fullName() == null || request.fullName().isBlank()
                || request.fullName().trim().length() > 100
                || (request.phone() != null && request.phone().length() > 15)
                || (request.gender() != null && request.gender().length() > 20)
                || (request.address() != null && request.address().length() > 500)
                || (request.emergencyContactName() != null && request.emergencyContactName().length() > 100)
                || (request.emergencyContactPhone() != null && request.emergencyContactPhone().length() > 15)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên hoặc thông tin liên hệ không hợp lệ.");
        }
        User user = findMember(memberId(authentication));
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        user.setAddress(request.address());
        user.setEmergencyContactName(request.emergencyContactName());
        user.setEmergencyContactPhone(request.emergencyContactPhone());
        if (request.avatar() != null && !request.avatar().isBlank()) {
            user.setAvatar(request.avatar());
        }
        return toProfileResponse(userRepository.save(user));
    }

    @PutMapping("/avatar")
    @Transactional
    public MemberProfileResponse updateAvatar(
            @RequestBody AvatarUpdateRequest request,
            Authentication authentication) {
        if (request == null || request.avatar() == null || request.avatar().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu hình ảnh không hợp lệ.");
        }
        User user = findMember(memberId(authentication));
        user.setAvatar(request.avatar());
        return toProfileResponse(userRepository.save(user));
    }

    @GetMapping("/health")
    @Transactional
    public MemberHealthProfile getHealthProfile(Authentication authentication) {
        Long memberId = memberId(authentication);
        MemberHealthProfile profile = healthRepository.findByMemberId(memberId).orElseGet(() -> {
            MemberHealthProfile empty = new MemberHealthProfile();
            empty.setMemberId(memberId);
            return empty;
        });
        if ((profile.getBmi() == null || profile.getBmi().compareTo(BigDecimal.ZERO) <= 0)
                && profile.getWeightKg() != null
                && profile.getHeightCm() != null
                && profile.getHeightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = profile.getHeightCm().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            profile.setBmi(profile.getWeightKg().divide(heightM.multiply(heightM), 1, RoundingMode.HALF_UP));
            profile = healthRepository.save(profile);
        }
        return profile;
    }

    @PutMapping("/health")
    @Transactional
    public MemberHealthProfile updateHealthProfile(
            @RequestBody MemberHealthProfileRequest request,
            Authentication authentication) {
        if (!isNonNegative(request.weightKg())
                || !isNonNegative(request.heightCm())
                || !isNonNegative(request.smmKg())
                || !isNonNegative(request.pbfPercent())
                || !isNonNegative(request.bmi())
                || (request.pbfPercent() != null && request.pbfPercent().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Các chỉ số sức khỏe không hợp lệ.");
        }
        Long memberId = memberId(authentication);
        MemberHealthProfile profile = healthRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    MemberHealthProfile created = new MemberHealthProfile();
                    created.setMemberId(memberId);
                    return created;
                });
        profile.setFitnessLevel(request.fitnessLevel());
        profile.setFitnessGoals(request.fitnessGoals());
        profile.setInjuryHistory(request.injuryHistory());
        profile.setWeightKg(request.weightKg());
        profile.setHeightCm(request.heightCm());
        profile.setSmmKg(request.smmKg());
        profile.setPbfPercent(request.pbfPercent());

        BigDecimal bmi = request.bmi();
        if ((bmi == null || bmi.compareTo(BigDecimal.ZERO) <= 0)
                && request.weightKg() != null
                && request.heightCm() != null
                && request.heightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = request.heightCm().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            bmi = request.weightKg().divide(heightM.multiply(heightM), 1, RoundingMode.HALF_UP);
        }
        profile.setBmi(bmi);
        profile.setUpdatedAt(LocalDateTime.now());
        return healthRepository.save(profile);
    }

    @GetMapping("/memberships")
    @Transactional(readOnly = true)
    public List<MemberMembershipResponse> getMemberships(Authentication authentication) {
        return membershipRepository.findByUserIdOrderByEndDateDesc(memberId(authentication))
                .stream()
                .map(membership -> {
                    MembershipPackage membershipPackage = packageRepository.findById(membership.getPackageId())
                            .orElse(null);
                    PaymentTransaction transaction = paymentTransactionRepository
                            .findFirstByMembershipIdOrderByCreatedAtDesc(membership.getMembershipId()).orElse(null);
                    return new MemberMembershipResponse(
                            membership.getMembershipId(),
                            membershipPackage == null ? "Gói tập" : membershipPackage.getName(),
                            membership.getStartDate(),
                            membership.getEndDate(),
                            membership.getStatus(),
                            membership.getPackageId(),
                            transaction == null ? null : transaction.getPaymentId(),
                            transaction == null ? null : transaction.getPaymentMethod());
                })
                .toList();
    }

    @GetMapping("/quota")
    @Transactional(readOnly = true)
    public MembershipQuotaResponse getQuota(Authentication authentication,
            @RequestParam(defaultValue = "CLASS") String bookingType,
            @RequestParam(required = false) Long itemId,
            @RequestParam(defaultValue = "1") double requiredHours) {
        Long userId = memberId(authentication);
        
        Long sportId = null;
        if ("CLASS".equalsIgnoreCase(bookingType) && itemId != null) sportId = classSessionRepository.findById(itemId).map(ClassSession::getSportId).orElse(null);
        if ("PT".equalsIgnoreCase(bookingType) && itemId != null) sportId = classSessionRepository.findByCoachIdOrderByStartTimeAsc(itemId).stream().map(ClassSession::getSportId).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        UserMembership chosen = "COURT".equalsIgnoreCase(bookingType)
            ? entitlementService.getActiveMembershipWithCourtQuota(userId, requiredHours)
            : entitlementService.getActiveMembershipWithQuota(userId, 1, bookingType.toUpperCase(Locale.ROOT), sportId);
        List<UserMembership> activeMemberships = chosen == null ? List.of() : List.of(chosen);
        if (activeMemberships.isEmpty()) {
            // Không có gói tập nào đang active
            return new MembershipQuotaResponse(
                    null,
                    null,
                    "Chưa có gói tập",
                    null,
                    null,
                    null,
                    0,
                    0,
                    0,
                    0,
                    false,
                    "Bạn chưa có gói tập nào. Vui lòng đăng ký gói để sử dụng dịch vụ.",
                    0, 0, 0, 0, false);
        }
        
        // Lấy membership đầu tiên (active và chưa hết hạn)
        UserMembership membership = activeMemberships.get(0);
        
        // Lấy thông tin package
        MembershipPackage pkg = packageRepository.findById(membership.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Không tìm thấy thông tin gói tập"));
        
        int remaining = membership.getRemainingQuotaSessions() != null ? membership.getRemainingQuotaSessions() : 0;
        int held = membership.getHeldQuotaSessions() != null ? membership.getHeldQuotaSessions() : 0;
        int used = membership.getUsedQuotaSessions() != null ? membership.getUsedQuotaSessions() : 0;
        int initial = membership.getInitialQuotaSessions() != null ? membership.getInitialQuotaSessions() : 0;
        
        // Court quota (Migration 002)
        int remainingCourts = membership.getRemainingQuotaCourts() != null ? membership.getRemainingQuotaCourts() : 0;
        int heldCourts = membership.getHeldQuotaCourts() != null ? membership.getHeldQuotaCourts() : 0;
        int usedCourts = membership.getUsedQuotaCourts() != null ? membership.getUsedQuotaCourts() : 0;
        int initialCourts = membership.getInitialQuotaCourts() != null ? membership.getInitialQuotaCourts() : 0;
        
        boolean canUse = remaining > 0 && !membership.getEndDate().isBefore(LocalDate.now());
        boolean canUseCourts = remainingCourts > 0 && !membership.getEndDate().isBefore(LocalDate.now());
        
        String message = String.format("Còn %d/%d buổi (đã dùng: %d, đang giữ: %d)", 
                remaining, initial, used, held);
        
        return new MembershipQuotaResponse(
                membership.getMembershipId(),
                pkg.getPackageId(),
                pkg.getName(),
                pkg.getPackageType() != null ? pkg.getPackageType().name() : "VIP",
                membership.getStartDate(),
                membership.getEndDate(),
                initial,
                remaining,
                held,
                used,
                canUse,
                message,
                initialCourts,
                remainingCourts,
                heldCourts,
                usedCourts,
                canUseCourts);
    }

    @GetMapping("/digital-card")
    @Transactional(readOnly = true)
    public Map<String, Object> getDigitalCard(Authentication authentication) {
        Long userId = memberId(authentication);
        User user = findMember(userId);

        List<UserMembership> activeMemberships = membershipRepository.findByUserIdOrderByEndDateDesc(userId).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && m.getStartDate() != null && !m.getStartDate().isAfter(LocalDate.now()) && m.getEndDate() != null && !m.getEndDate().isBefore(LocalDate.now()))
                .toList();

        List<Map<String, Object>> activePackageList = new ArrayList<>();
        boolean isVip = false;

        for (UserMembership m : activeMemberships) {
            MembershipPackage pkg = packageRepository.findById(m.getPackageId()).orElse(null);
            String pkgName = pkg != null ? pkg.getName() : "Gói tập";
            if (pkg != null && pkg.getPackageType() == com.sporthub.backend.enums.PackageType.VIP) {
                isVip = true;
            }
            long remainingDays = m.getEndDate() != null ? Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), m.getEndDate())) : 30;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("membershipId", m.getMembershipId());
            item.put("packageName", pkgName);
            item.put("startDate", m.getStartDate() != null ? m.getStartDate().toString() : "");
            item.put("endDate", m.getEndDate() != null ? m.getEndDate().toString() : "");
            item.put("remainingDays", remainingDays);
            activePackageList.add(item);
        }

        String tier;
        String tierBadge;
        if (isVip) {
            tier = "VIP";
            tierBadge = "HỘI VIÊN VIP";
        } else if (!activePackageList.isEmpty()) {
            tier = "STANDARD";
            tierBadge = "HỘI VIÊN STANDARD";
        } else {
            tier = "BASIC";
            tierBadge = "HỘI VIÊN CHÍNH THỨC";
        }

        LocalDate today = LocalDate.now();
        List<Booking> memberBookings = bookingRepository.findByMemberId(userId);
        List<Map<String, Object>> todayBookings = new ArrayList<>();

        for (Booking b : memberBookings) {
            if ("CANCELLED".equalsIgnoreCase(b.getStatus())) {
                continue;
            }
            ClassSession session = classSessionRepository.findById(b.getSessionId()).orElse(null);
            if (session != null && session.getStartTime() != null && session.getStartTime().toLocalDate().isEqual(today)) {
                Map<String, Object> tb = new LinkedHashMap<>();
                tb.put("bookingId", b.getBookingId());
                tb.put("courtName", session.getClassName());
                tb.put("activity", session.getClassName());
                tb.put("startTime", String.format("%02d:%02d", session.getStartTime().getHour(), session.getStartTime().getMinute()));
                tb.put("endTime", session.getEndTime() != null 
                        ? String.format("%02d:%02d", session.getEndTime().getHour(), session.getEndTime().getMinute()) 
                        : "");
                tb.put("status", b.getAttendanceStatus() != null ? b.getAttendanceStatus().name() : b.getStatus());
                todayBookings.add(tb);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("memberId", userId);
        response.put("fullName", user.getFullName());
        response.put("rfidCode", user.getRfidCode());
        response.put("qrToken", "SPORTHUB-MEMBER-" + userId);
        response.put("tier", tier);
        response.put("tierBadge", tierBadge);
        response.put("activePackages", activePackageList);
        response.put("todayBookings", todayBookings);

        return response;
    }

    @PostMapping("/memberships")
    @Transactional
    public MemberPackagePurchaseResponse purchaseMembership(
            @RequestBody MemberPackagePurchaseRequest request,
            Authentication authentication) {
        if (request == null || request.packageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn gói tập.");
        }
        Long userId = memberId(authentication);
        MembershipPackage membershipPackage = packageRepository.findById(request.packageId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gói tập không còn được mở bán."));

        // Serialize purchases by member so repeated clicks cannot create multiple charges.
        userRepository.findByIdForUpdate(userId);
        if (membershipRepository.existsByUserIdAndPackageIdAndStatusIn(userId, request.packageId(),
                List.of("PENDING_PAYMENT", "PENDING", "PENDING_APPROVAL"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói tập này đang chờ thanh toán hoặc chờ duyệt. Vui lòng kiểm tra yêu cầu hiện có.");
        }

        // Each purchase is independent; the currently active term is never overwritten.
        UserMembership targetMembership = new UserMembership();
        targetMembership.setUserId(userId);
        targetMembership.setPackageId(membershipPackage.getPackageId());
        targetMembership.setStatus("PENDING_PAYMENT");
        targetMembership = membershipRepository.save(targetMembership);

        // Tạo bản ghi thanh toán
        String method = (request.paymentMethod() == null || request.paymentMethod().isBlank())
                ? "VNPAY"
                : request.paymentMethod().toUpperCase(Locale.ROOT);

        String receptionPaymentMethod = switch (method) {
            case "CASH_COUNTER", "CASH" -> "CASH";
            case "POS" -> "POS";
            default -> "ONLINE";
        };

        boolean isInstantPaid = membershipPackage.getPrice().signum() == 0; // Member payment always instant (CASH) or redirect to VNPAY

        // ✅ Giữ nguyên ReceptionPayment (old system - legacy compatibility)
        ReceptionPayment payment = new ReceptionPayment();
        payment.setMemberId(Math.toIntExact(userId));
        payment.setMembershipId(Math.toIntExact(targetMembership.getMembershipId()));
        payment.setAmount(membershipPackage.getPrice());
        payment.setPaymentMethod(receptionPaymentMethod);
        payment.setPaymentStatus(isInstantPaid ? "COMPLETED" : "PENDING");
        payment.setCreatedAt(LocalDateTime.now());
        ReceptionPayment savedPayment = paymentRepository.save(payment);

        // ✅ Use PaymentService instead of manual creation
        PaymentTransaction savedTransaction = paymentService.createPayment(
                userId, 
                "MEMBERSHIP_PACKAGE", 
                membershipPackage.getPrice(), 
                method);
        savedTransaction.setMembershipId(targetMembership.getMembershipId());
        if (request.voucherCode() != null && !request.voucherCode().isBlank()) {
            voucherService.apply(savedTransaction, request.voucherCode());
            savedPayment.setAmount(savedTransaction.getAmount());
            savedPayment.setPaymentStatus("PAID".equals(savedTransaction.getPaymentStatus()) ? "COMPLETED" : "PENDING");
            paymentRepository.save(savedPayment);
        }
        paymentTransactionRepository.save(savedTransaction);
        if ("PAID".equals(savedTransaction.getPaymentStatus())) {
            targetMembership.setStatus("PENDING_APPROVAL");
            membershipRepository.save(targetMembership);
        }


        return new MemberPackagePurchaseResponse(
                savedTransaction.getPaymentId(), // ← Trả về PaymentTransaction.paymentId để frontend dùng cho QR polling
                targetMembership.getMembershipId(),
                membershipPackage.getName(),
                savedPayment.getAmount(),
                savedTransaction.getPaymentStatus(), // ← Trả về PaymentTransaction.paymentStatus (PENDING cho VNPAY, PAID cho còn lại)
                savedPayment.getCreatedAt(),
                savedTransaction.getReferenceCode());
    }

    @GetMapping("/attendance")
    @Transactional(readOnly = true)
    public MemberAttendanceSummaryResponse getAttendance(Authentication authentication) {
        Long userId = memberId(authentication);
        List<Booking> memberBookings = bookingRepository.findByMemberId(userId);

        Map<Long, ClassSession> sessionMap = classSessionRepository.findAllById(
                memberBookings.stream().map(Booking::getSessionId).distinct().toList()).stream()
                .collect(Collectors.toMap(ClassSession::getSessionId, Function.identity()));

        Map<Long, User> coachMap = userRepository.findAllById(
                sessionMap.values().stream().map(ClassSession::getCoachId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        Map<Long, String> sportMap = publicSportRepository.findAll().stream()
                .collect(Collectors.toMap(PublicSport::getSportId, PublicSport::getName));

        int attended = 0;
        int absent = 0;
        int pending = 0;

        List<MemberAttendanceRecordResponse> records = new ArrayList<>();
        for (Booking booking : memberBookings) {
            if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) continue;
            ClassSession session = sessionMap.get(booking.getSessionId());
            if (session == null) continue;
            User coach = coachMap.get(session.getCoachId());
            String sportName = sportMap.getOrDefault(session.getSportId(), "Thể thao");

            String status = booking.getAttendanceStatus() == null ? "PENDING" : booking.getAttendanceStatus().name();
            if ("PRESENT".equals(status) || "ATTENDED".equals(status)) {
                attended++;
            } else if ("EXCUSED_ABSENCE".equals(status) || "UNEXCUSED_ABSENCE".equals(status) || "ABSENT".equals(status)) {
                absent++;
            } else {
                pending++;
            }

            records.add(new MemberAttendanceRecordResponse(
                    booking.getBookingId(),
                    session.getSessionId(),
                    session.getClassName(),
                    sportName,
                    coach == null ? "Huấn luyện viên" : coach.getFullName(),
                    coach == null ? null : coach.getAvatar(),
                    session.getStartTime(),
                    session.getEndTime(),
                    status,
                    booking.getCoachNote()));
        }

        records.sort((a, b) -> b.startTime().compareTo(a.startTime()));

        int completedTotal = attended + absent;
        BigDecimal rate = completedTotal == 0
                ? BigDecimal.valueOf(100)
                : BigDecimal.valueOf(attended * 100.0 / completedTotal).setScale(1, RoundingMode.HALF_UP);

        List<MemberCheckInResponse> gateCheckIns = memberCheckInRepository
                .findByMemberIdOrderByCheckedInAtDesc(userId)
                .stream()
                .map(ci -> new MemberCheckInResponse(
                        ci.getCheckInId(),
                        ci.getCheckedInAt(),
                        ci.getResult(),
                        "Cổng trung tâm F Sport Center"))
                .toList();

        return new MemberAttendanceSummaryResponse(
                records.size(),
                attended,
                absent,
                pending,
                rate,
                records,
                gateCheckIns);
    }

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<MemberNotificationResponse> getNotifications(Authentication authentication) {
        Long userId = memberId(authentication);
        List<MemberNotificationResponse> notifications = new ArrayList<>();

        // Kiểm tra thời hạn gói tập
        List<UserMembership> activeMemberships = membershipRepository.findByUserIdOrderByEndDateDesc(userId).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                .toList();

        if (!activeMemberships.isEmpty()) {
            UserMembership current = activeMemberships.get(0);
            MembershipPackage pkg = packageRepository.findById(current.getPackageId()).orElse(null);
            if (current.getEndDate() != null && pkg != null) {
                long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), current.getEndDate());
                if (daysRemaining <= 7 && daysRemaining >= 0) {
                    notifications.add(new MemberNotificationResponse(
                            "pkg-exp-" + current.getMembershipId(),
                            "MEMBERSHIP_EXPIRY",
                            "Gói thành viên sắp hết hạn",
                            "Gói " + pkg.getName() + " của bạn còn " + daysRemaining + " ngày sẽ hết hạn (vào " + current.getEndDate() + "). Hãy gia hạn ngay để không gián đoạn tập luyện.",
                            LocalDateTime.now().minusHours(2),
                            false,
                            "/member/packages"));
                } else if (daysRemaining < 0) {
                    notifications.add(new MemberNotificationResponse(
                            "pkg-expired-" + current.getMembershipId(),
                            "MEMBERSHIP_EXPIRY",
                            "Gói tập đã hết hạn",
                            "Gói " + pkg.getName() + " của bạn đã hết hạn vào " + current.getEndDate() + ". Đăng ký hoặc gia hạn gói để tiếp tục sử dụng tiện ích.",
                            LocalDateTime.now().minusDays(1),
                            false,
                            "/member/packages"));
                }
            }
        } else {
            notifications.add(new MemberNotificationResponse(
                    "pkg-none",
                    "MEMBERSHIP_EXPIRY",
                    "Khám phá các gói hội viên F Sport",
                    "Bạn chưa kích hoạt gói tập nào. Hãy chọn gói Basic, Silver, Gold hoặc VIP để trải nghiệm trọn vẹn dịch vụ.",
                    LocalDateTime.now().minusHours(12),
                    false,
                    "/member/packages"));
        }

        // Nhắc lịch học trong 48h tới
        List<Booking> upcomingBookings = bookingRepository.findByMemberIdAndStatusIn(userId, List.of("BOOKED", "CONFIRMED"));
        for (Booking booking : upcomingBookings) {
            classSessionRepository.findById(booking.getSessionId()).ifPresent(session -> {
                if (session.getStartTime().isAfter(LocalDateTime.now())
                        && session.getStartTime().isBefore(LocalDateTime.now().plusHours(48))) {
                    notifications.add(new MemberNotificationResponse(
                            "session-remind-" + booking.getBookingId(),
                            "CLASS_REMINDER",
                            "Nhắc nhở lịch học: " + session.getClassName(),
                            "Lớp học diễn ra vào lúc " + session.getStartTime().toLocalTime() + " ngày " + session.getStartTime().toLocalDate() + ". Vui lòng đến trước 10 phút.",
                            LocalDateTime.now().minusHours(1),
                            false,
                            "/member/schedule"));
                }
            });
        }

        // Nhận xét từ HLV các buổi gần nhất
        List<Booking> pastWithNotes = bookingRepository.findByMemberId(userId).stream()
                .filter(b -> b.getCoachNote() != null && !b.getCoachNote().isBlank())
                .sorted((a, b) -> b.getBookingTime().compareTo(a.getBookingTime()))
                .limit(3)
                .toList();

        for (Booking booking : pastWithNotes) {
            classSessionRepository.findById(booking.getSessionId()).ifPresent(session -> {
                notifications.add(new MemberNotificationResponse(
                        "coach-note-" + booking.getBookingId(),
                        "COACH_FEEDBACK",
                        "Nhận xét mới từ HLV cho " + session.getClassName(),
                        "Huấn luyện viên đã gửi đánh giá: \"" + booking.getCoachNote() + "\"",
                        booking.getBookingTime(),
                        true,
                        "/member/workout-plans"));
            });
        }

        // Thông báo chào mừng
        notifications.add(new MemberNotificationResponse(
                "sys-welcome",
                "SYSTEM",
                "Chào mừng đến với F Sport Center",
                "Hệ thống thể thao công nghệ cao FPT Athletic Sanctuary hân hạnh đồng hành cùng mục tiêu thể lực của bạn.",
                LocalDateTime.now().minusDays(3),
                true,
                "/member"));

        return notifications;
    }

    @GetMapping("/transactions")
    @Transactional(readOnly = true)
    public List<MemberTransactionResponse> getTransactions(Authentication authentication) {
        Long userId = memberId(authentication);
        return paymentTransactionRepository.findByMemberIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(tx -> new MemberTransactionResponse(
                        tx.getPaymentId(),
                        tx.getReferenceCode(),
                        tx.getItemType() != null ? tx.getItemType() : mapBookingTypeToItemType(tx.getBookingType()),
                        tx.getItemDescription() != null ? tx.getItemDescription() : mapTransactionDescription(tx.getBookingType()),
                        tx.getAmount(),
                        tx.getPaymentMethod(),
                        tx.getPaymentStatus(),
                        tx.getCreatedAt()))
                .toList();
    }

    /**
     * Map bookingType to frontend itemType (fallback for old data without itemType)
     */
    private String mapBookingTypeToItemType(String bookingType) {
        if (bookingType == null) return null;
        return switch (bookingType.toUpperCase(Locale.ROOT)) {
            case "MEMBERSHIP_PACKAGE" -> "MEMBERSHIP";
            case "COURT", "CLASS", "PT" -> bookingType.toUpperCase(Locale.ROOT);
            case "COURT_REFUND" -> "COURT";
            case "CLASS_REFUND" -> "CLASS";
            case "MEMBERSHIP_REFUND" -> "MEMBERSHIP";
            default -> null;
        };
    }

    private String mapTransactionDescription(String bookingType) {
        if (bookingType == null) return "Giao dịch F Sport";
        return switch (bookingType.toUpperCase(Locale.ROOT)) {
            case "MEMBERSHIP_PACKAGE" -> "Thanh toán Gói Hội Viên";
            case "COURT" -> "Thuê Sân Thi Đấu Thể Thao";
            case "CLASS" -> "Đăng Ký Khóa Học Thể Thao";
            case "COURT_REFUND" -> "Hoàn Tiền Hủy Thuê Sân (100%)";
            case "CLASS_REFUND" -> "Hoàn Tiền Hủy Lớp Học (100%)";
            default -> "Giao dịch hệ thống " + bookingType;
        };
    }

    private Long memberId(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        boolean isAuthorized = authentication.getAuthorities().stream()
                .anyMatch(authority -> {
                    String auth = authority.getAuthority().toUpperCase(java.util.Locale.ROOT);
                    return auth.contains("MEMBER") || auth.contains("ADMIN") || auth.contains("MANAGER") || auth.contains("CUSTOMER") || auth.contains("COACH");
                });
        if (!isAuthorized) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ hội viên mới được truy cập hồ sơ.");
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private User findMember(Long memberId) {
        return userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
    }

    private MemberProfileResponse toProfileResponse(User user) {
        return new MemberProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getDateOfBirth(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getGender(),
                user.getAddress(),
                user.getEmergencyContactName(),
                user.getEmergencyContactPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt());
    }

    private boolean isNonNegative(BigDecimal value) {
        return value == null || value.signum() >= 0;
    }
}
