package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AvatarUpdateRequest;
import com.sporthub.backend.dto.MemberAttendanceRecordResponse;
import com.sporthub.backend.dto.MemberAttendanceSummaryResponse;
import com.sporthub.backend.dto.MemberCheckInResponse;
import com.sporthub.backend.dto.MemberCourtBookingAttendanceResponse;
import com.sporthub.backend.dto.MemberHealthProfileRequest;
import com.sporthub.backend.dto.MemberMembershipResponse;
import com.sporthub.backend.dto.MemberNotificationResponse;
import com.sporthub.backend.dto.MemberPackagePurchaseRequest;
import com.sporthub.backend.dto.MemberPackagePurchaseResponse;
import com.sporthub.backend.dto.MemberProfileRequest;
import com.sporthub.backend.dto.MemberProfileResponse;
import com.sporthub.backend.dto.MemberTransactionResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.MemberHealthProfile;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.MemberHealthProfileRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final CourtBookingRepository courtBookingRepository;
    private final SportsCourtRepository sportsCourtRepository;

    @Autowired
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
            CourtBookingRepository courtBookingRepository,
            SportsCourtRepository sportsCourtRepository) {
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
        this.courtBookingRepository = courtBookingRepository;
        this.sportsCourtRepository = sportsCourtRepository;
    }

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
            PublicSportRepository publicSportRepository) {
        this(userRepository, healthRepository, membershipRepository, packageRepository,
             paymentRepository, paymentTransactionRepository, bookingRepository,
             classSessionRepository, memberCheckInRepository, publicSportRepository, null, null);
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
    @Transactional(readOnly = true)
    public MemberHealthProfile getHealthProfile(Authentication authentication) {
        Long memberId = memberId(authentication);
        return healthRepository.findByMemberId(memberId).orElseGet(() -> {
            MemberHealthProfile empty = new MemberHealthProfile();
            empty.setMemberId(memberId);
            return empty;
        });
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
        profile.setBmi(request.bmi());
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
                    return new MemberMembershipResponse(
                            membership.getMembershipId(),
                            membershipPackage == null ? "Gói tập" : membershipPackage.getName(),
                            membership.getStartDate(),
                            membership.getEndDate(),
                            membership.getStatus());
                })
                .toList();
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

        // Chỉ so sánh với gói đang hoạt động CÙNG bộ môn; gói khác bộ môn là quyền lợi độc lập,
        // không bị chặn "gói thấp hơn" hay bị thay thế.
        List<UserMembership> activeMemberships = membershipRepository.findByUserIdOrderByEndDateDesc(userId).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && (m.getEndDate() == null || !m.getEndDate().isBefore(LocalDate.now())))
                .filter(m -> packageRepository.findById(m.getPackageId())
                        .map(p -> java.util.Objects.equals(p.getSportId(), membershipPackage.getSportId()))
                        .orElse(false))
                .toList();

        UserMembership targetMembership;
        if (!activeMemberships.isEmpty()) {
            UserMembership currentMembership = activeMemberships.get(0);
            MembershipPackage currentPackage = packageRepository.findById(currentMembership.getPackageId()).orElse(null);

            if (currentPackage != null) {
                if (membershipPackage.getPackageId().equals(currentPackage.getPackageId())) {
                    // Gia hạn gói đang dùng
                    LocalDate currentEnd = currentMembership.getEndDate() != null && !currentMembership.getEndDate().isBefore(LocalDate.now())
                            ? currentMembership.getEndDate()
                            : LocalDate.now();
                    currentMembership.setEndDate(currentEnd.plusDays(membershipPackage.getDurationDays()));
                    currentMembership.setStatus("ACTIVE");
                    targetMembership = membershipRepository.save(currentMembership);
                } else if (membershipPackage.getPrice().compareTo(currentPackage.getPrice()) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Bạn đang sử dụng gói " + currentPackage.getName() + ". Không thể đăng ký gói thấp hơn gói hiện tại.");
                } else if (membershipPackage.getPrice().compareTo(currentPackage.getPrice()) == 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Bạn đang có gói " + currentPackage.getName() + " đang kích hoạt. Bạn chỉ có thể gia hạn gói này hoặc nâng cấp lên gói cao hơn.");
                } else {
                    // Nâng cấp lên gói cao hơn (hết hạn gói cũ)
                    currentMembership.setStatus("EXPIRED");
                    membershipRepository.save(currentMembership);

                    UserMembership newMembership = new UserMembership();
                    newMembership.setUserId(userId);
                    newMembership.setPackageId(membershipPackage.getPackageId());
                    newMembership.setStartDate(LocalDate.now());
                    newMembership.setEndDate(LocalDate.now().plusDays(membershipPackage.getDurationDays()));
                    newMembership.setStatus("ACTIVE");
                    targetMembership = membershipRepository.save(newMembership);
                }
            } else {
                currentMembership.setPackageId(membershipPackage.getPackageId());
                currentMembership.setStartDate(LocalDate.now());
                currentMembership.setEndDate(LocalDate.now().plusDays(membershipPackage.getDurationDays()));
                currentMembership.setStatus("ACTIVE");
                targetMembership = membershipRepository.save(currentMembership);
            }
        } else {
            // Đăng ký mới
            UserMembership newMembership = new UserMembership();
            newMembership.setUserId(userId);
            newMembership.setPackageId(membershipPackage.getPackageId());
            newMembership.setStartDate(LocalDate.now());
            newMembership.setEndDate(LocalDate.now().plusDays(membershipPackage.getDurationDays()));
            newMembership.setStatus("ACTIVE");
            targetMembership = membershipRepository.save(newMembership);
        }

        // Tạo bản ghi thanh toán
        String method = (request.paymentMethod() == null || request.paymentMethod().isBlank())
                ? "SANDBOX"
                : request.paymentMethod().toUpperCase(Locale.ROOT);
        String prefix = switch (method) {
            case "VIETQR", "QR" -> "VQR";
            case "VNPAY" -> "VNP";
            case "MOMO" -> "MOM";
            case "CASH_COUNTER", "CASH" -> "CSH";
            default -> "SBX";
        };

        String receptionPaymentMethod = switch (method) {
            case "VIETQR", "QR", "TRANSFER" -> "TRANSFER";
            case "CASH_COUNTER", "CASH" -> "CASH";
            case "POS" -> "POS";
            default -> "ONLINE";
        };

        ReceptionPayment payment = new ReceptionPayment();
        payment.setMemberId(Math.toIntExact(userId));
        payment.setMembershipId(Math.toIntExact(targetMembership.getMembershipId()));
        payment.setAmount(membershipPackage.getPrice());
        payment.setPaymentMethod(receptionPaymentMethod);
        payment.setPaymentStatus("COMPLETED");
        payment.setCreatedAt(LocalDateTime.now());
        ReceptionPayment savedPayment = paymentRepository.save(payment);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setMemberId(userId);
        transaction.setBookingType("MEMBERSHIP_PACKAGE");
        transaction.setAmount(membershipPackage.getPrice());
        transaction.setPaymentMethod(method);
        transaction.setPaymentStatus("PAID");
        transaction.setReferenceCode(prefix + "-PKG-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT));
        transaction.setCreatedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        return new MemberPackagePurchaseResponse(
                savedPayment.getPaymentId().longValue(),
                targetMembership.getMembershipId(),
                membershipPackage.getName(),
                savedPayment.getAmount(),
                savedPayment.getPaymentStatus(),
                savedPayment.getCreatedAt(),
                transaction.getReferenceCode());
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

            String status = booking.getAttendanceStatus() == null ? "PENDING" : booking.getAttendanceStatus().toUpperCase(Locale.ROOT);
            if ("PRESENT".equals(status)) {
                attended++;
            } else if ("ABSENT".equals(status)) {
                absent++;
                String note = booking.getCoachNote() != null ? booking.getCoachNote() : "";
                if (note.contains("[Vắng có phép]") || note.toLowerCase(Locale.ROOT).contains("có phép")) {
                    status = "EXCUSED_ABSENCE";
                } else {
                    status = "UNEXCUSED_ABSENCE";
                }
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

        List<MemberCourtBookingAttendanceResponse> courtBookings = new ArrayList<>();
        if (courtBookingRepository != null) {
            Map<Long, SportsCourt> courtMap = sportsCourtRepository != null
                    ? sportsCourtRepository.findAll().stream().collect(Collectors.toMap(SportsCourt::getCourtId, Function.identity()))
                    : Map.of();
            courtBookings = courtBookingRepository.findByMemberIdOrderByStartTimeAsc(userId).stream()
                    .map(cb -> {
                        SportsCourt court = courtMap.get(cb.getCourtId());
                        String cName = court != null ? court.getCourtName() : "Sân #" + cb.getCourtId();
                        String sName = (court != null && sportMap.containsKey(court.getSportId()))
                                ? sportMap.get(court.getSportId()) : "Thể thao";
                        return new MemberCourtBookingAttendanceResponse(
                                cb.getCourtBookingId(),
                                cb.getCourtId(),
                                cName,
                                sName,
                                cb.getStartTime(),
                                cb.getEndTime(),
                                cb.getAmountPaid(),
                                cb.getStatus()
                        );
                    })
                    .toList();
        }

        return new MemberAttendanceSummaryResponse(
                records.size(),
                attended,
                absent,
                pending,
                rate,
                records,
                gateCheckIns,
                courtBookings);
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
                        tx.getBookingType(),
                        mapTransactionDescription(tx.getBookingType()),
                        tx.getAmount(),
                        tx.getPaymentMethod(),
                        tx.getPaymentStatus(),
                        tx.getCreatedAt()))
                .toList();
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

    public record DigitalCardResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String avatar,
            String rfidCode,
            String qrToken,
            String tier,
            List<Map<String, Object>> activePackages,
            List<Map<String, Object>> todayBookings
    ) {}

    @GetMapping("/digital-card")
    @Transactional
    public DigitalCardResponse getDigitalCard(Authentication authentication) {
        Long uid = memberId(authentication);
        User user = findMember(uid);
        LocalDate today = LocalDate.now();

        // 1. Quét chuyển gói quá hạn sang EXPIRED
        List<UserMembership> allMemberships = membershipRepository.findByUserIdOrderByEndDateDesc(uid);
        for (UserMembership m : allMemberships) {
            if ("ACTIVE".equalsIgnoreCase(m.getStatus()) && m.getEndDate() != null && m.getEndDate().isBefore(today)) {
                m.setStatus("EXPIRED");
                membershipRepository.save(m);
            }
        }

        // 2. Lấy các gói còn hiệu lực
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
            long daysLeft = m.getEndDate() != null ? Math.max(0, ChronoUnit.DAYS.between(today, m.getEndDate()) + 1) : 0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("membershipId", m.getMembershipId());
            row.put("packageId", m.getPackageId());
            row.put("packageName", pkgName);
            row.put("startDate", m.getStartDate());
            row.put("endDate", m.getEndDate());
            row.put("daysRemaining", daysLeft);
            activePackages.add(row);
        }

        // 3. Lấy booking hôm nay
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.plusDays(1).atStartOfDay();
        List<Map<String, Object>> todayBookings = new ArrayList<>();
        if (bookingRepository != null) {
            for (Booking b : bookingRepository.findByMemberId(uid)) {
                if ("CANCELLED".equalsIgnoreCase(b.getStatus())) continue;
                if (b.getSessionId() != null) {
                    ClassSession s = classSessionRepository.findById(b.getSessionId()).orElse(null);
                    if (s != null && s.getStartTime() != null
                            && !s.getStartTime().isBefore(startOfToday) && s.getStartTime().isBefore(endOfToday)) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("bookingId", b.getBookingId());
                        row.put("sessionId", s.getSessionId());
                        row.put("type", "CLASS");
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

        String qrToken = "SPORTHUB-MEMBER-" + uid;

        return new DigitalCardResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getRfidCode(),
                qrToken,
                tier,
                activePackages,
                todayBookings
        );
    }

    private boolean isNonNegative(BigDecimal value) {
        return value == null || value.signum() >= 0;
    }
}
