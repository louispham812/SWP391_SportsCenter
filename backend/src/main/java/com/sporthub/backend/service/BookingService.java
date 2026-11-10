package com.sporthub.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.BookingQuoteResponse;
import com.sporthub.backend.dto.CancelBookingResponse;
import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.dto.ClassSessionResponse;
import com.sporthub.backend.dto.CoachPublicProfileResponse;
import com.sporthub.backend.dto.CoachScheduleEntryResponse;
import com.sporthub.backend.dto.CoachStudentBookingResponse;
import com.sporthub.backend.dto.CourtSlotResponse;
import com.sporthub.backend.dto.MemberScheduleEntryResponse;
import com.sporthub.backend.dto.ReceptionistClassResponse;
import com.sporthub.backend.dto.RosterBookingResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.CourtMaintenance;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.enums.AttendanceStatus;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.CourtMaintenanceRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;

@Service
public class BookingService {
    
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(BookingService.class);

    // ACTIVE_STATUSES: BOOKED (chờ thanh toán) + CONFIRMED (đã thanh toán) để đếm slot chính xác
    // Chi tiết: xem PAYMENT_FLOW_DOCUMENTATION.md - Rule 4
    private static final List<String> ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED");
    private static final List<String> ALL_ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED", "WAITLIST");

    private final BookingRepository bookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final UserRepository userRepository;
    private final PublicSportRepository publicSportRepository;
    private final PublicFacilityRepository publicFacilityRepository;
    private final SportsCourtRepository sportsCourtRepository;
    private final CourtBookingRepository courtBookingRepository;
    private final CourtMaintenanceRepository courtMaintenanceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final MembershipPackageRepository membershipPackageRepository;
    private final MembershipService membershipService;
    private final AuditLogService auditLogService;
    private final PaymentService paymentService;
    private final com.sporthub.backend.repository.FacilityRepository facilityRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final EngagementService engagementService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FacilityCourtSyncService syncService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private VoucherService voucherService;
    @org.springframework.beans.factory.annotation.Autowired(required = false) private CoachAvailabilityService coachAvailability;

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            CourtMaintenanceRepository courtMaintenanceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            @Lazy MembershipService membershipService,
            AuditLogService auditLogService) {
        this(bookingRepository, classSessionRepository, userRepository, publicSportRepository,
                publicFacilityRepository, sportsCourtRepository, courtBookingRepository,
                courtMaintenanceRepository, paymentTransactionRepository, userMembershipRepository,
                membershipPackageRepository, membershipService, auditLogService, null, null, null, null, null);
    }

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            CourtMaintenanceRepository courtMaintenanceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            @Lazy MembershipService membershipService,
            AuditLogService auditLogService,
            PaymentService paymentService) {
        this(bookingRepository, classSessionRepository, userRepository, publicSportRepository,
                publicFacilityRepository, sportsCourtRepository, courtBookingRepository,
                courtMaintenanceRepository, paymentTransactionRepository, userMembershipRepository,
                membershipPackageRepository, membershipService, auditLogService, paymentService, null, null, null, null);
    }

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            CourtMaintenanceRepository courtMaintenanceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            @Lazy MembershipService membershipService,
            AuditLogService auditLogService,
            com.sporthub.backend.repository.FacilityRepository facilityRepository) {
        this(bookingRepository, classSessionRepository, userRepository, publicSportRepository,
                publicFacilityRepository, sportsCourtRepository, courtBookingRepository,
                courtMaintenanceRepository, paymentTransactionRepository, userMembershipRepository,
                membershipPackageRepository, membershipService, auditLogService, null, facilityRepository, null, null, null);
    }

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            CourtMaintenanceRepository courtMaintenanceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            @Lazy MembershipService membershipService,
            AuditLogService auditLogService,
            PaymentService paymentService,
            com.sporthub.backend.repository.FacilityRepository facilityRepository,
            com.sporthub.backend.service.gateway.VNPayGateway vnpayGateway) {
        this(bookingRepository, classSessionRepository, userRepository, publicSportRepository,
                publicFacilityRepository, sportsCourtRepository, courtBookingRepository,
                courtMaintenanceRepository, paymentTransactionRepository, userMembershipRepository,
                membershipPackageRepository, membershipService, auditLogService, paymentService, facilityRepository, vnpayGateway, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            CourtMaintenanceRepository courtMaintenanceRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            @Lazy MembershipService membershipService,
            AuditLogService auditLogService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) PaymentService paymentService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.sporthub.backend.repository.FacilityRepository facilityRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.sporthub.backend.service.gateway.VNPayGateway vnpayGateway,
            @org.springframework.beans.factory.annotation.Autowired(required = false) RefundRequestRepository refundRequestRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) EngagementService engagementService) {
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userRepository = userRepository;
        this.publicSportRepository = publicSportRepository;
        this.publicFacilityRepository = publicFacilityRepository;
        this.sportsCourtRepository = sportsCourtRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.courtMaintenanceRepository = courtMaintenanceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.membershipPackageRepository = membershipPackageRepository;
        this.membershipService = membershipService;
        this.auditLogService = auditLogService;
        this.paymentService = paymentService;
        this.facilityRepository = facilityRepository;
        this.refundRequestRepository = refundRequestRepository;
        this.engagementService = engagementService;
    }

    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getUpcomingClasses(Long actorId, String actorRole) {
        List<ClassSession> sessions = classSessionRepository.findAll().stream()
                .filter(session -> "SCHEDULED".equalsIgnoreCase(session.getStatus()))
                .filter(session -> session.getStartTime() != null && session.getStartTime().isAfter(LocalDateTime.now()))
                .filter(session -> !"COACH".equals(actorRole) || session.getCoachId().equals(actorId))
                .sorted((left, right) -> left.getStartTime().compareTo(right.getStartTime()))
                .toList();
        Map<Long, Booking> bookingsBySession = bookingRepository.findByMemberIdAndStatusIn(actorId, ALL_ACTIVE_STATUSES).stream()
                .collect(Collectors.toMap(Booking::getSessionId, Function.identity(), (first, second) -> first));
        
        // Query RefundRequests for this member
        Map<String, String> refundStatusMap = new java.util.HashMap<>();
        if (refundRequestRepository != null) {
            List<com.sporthub.backend.entity.RefundRequest> refundRequests = 
                refundRequestRepository.findByMemberIdOrderByCreatedAtDesc(actorId);
            
            for (com.sporthub.backend.entity.RefundRequest r : refundRequests) {
                if (r.getBookingId() != null && "CLASS".equals(r.getBookingType())) {
                    // Only map active refund states
                    if ("PENDING_APPROVAL".equals(r.getStatus()) || "APPROVED".equals(r.getStatus())) {
                        refundStatusMap.put(String.valueOf(r.getBookingId()), r.getStatus());
                    }
                }
            }
        }
        
        Map<Long, String> coachNames = userRepository.findAllById(
                        sessions.stream().map(ClassSession::getCoachId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, User::getFullName));
        List<Long> sessionIds = sessions.stream().map(ClassSession::getSessionId).toList();
        Map<Long, Long> bookedCounts = sessionIds.isEmpty()
                ? Map.of()
                : bookingRepository.findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES).stream()
                        .collect(Collectors.groupingBy(Booking::getSessionId, Collectors.counting()));

        Map<Long, String> facilityStatuses = (facilityRepository != null)
                ? facilityRepository.findAll().stream()
                        .collect(Collectors.toMap(com.sporthub.backend.entity.Facility::getFacilityId, com.sporthub.backend.entity.Facility::getStatus, (a, b) -> a))
                : Map.of();

        return sessions.stream().map(session -> {
            Booking booking = bookingsBySession.get(session.getSessionId());
            String facStatus = facilityStatuses.get(session.getFacilityId());
            String effectiveStatus = ("MAINTENANCE".equalsIgnoreCase(facStatus)) ? "MAINTENANCE" : session.getStatus();
            
            // Check refund status if booking exists
            String refundStatus = null;
            if (booking != null && booking.getBookingId() != null) {
                refundStatus = refundStatusMap.get(String.valueOf(booking.getBookingId()));
            }
            
            return new ClassSessionResponse(
                    session.getSessionId(),
                    session.getClassName(),
                    session.getSportId(),
                    session.getCoachId(),
                    coachNames.get(session.getCoachId()),
                    session.getFacilityId(),
                    session.getStartTime(),
                    session.getEndTime(),
                    session.getMaxSlots(),
                    bookedCounts.getOrDefault(session.getSessionId(), 0L).intValue(),
                    effectiveStatus,
                    booking == null ? null : booking.getBookingId(),
                    booking == null ? null : booking.getStatus(),
                    refundStatus,
                    session.getPriceAmount());
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<CoachScheduleEntryResponse> getCoachSchedule(Long coachId, LocalDate weekStart) {
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekStart.plusDays(7).atStartOfDay();
        List<ClassSession> sessions = classSessionRepository
                .findByCoachIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
                        coachId, start, end);
        if (sessions.isEmpty()) {
            return List.of();
        }

        List<Long> sessionIds = sessions.stream().map(ClassSession::getSessionId).toList();
        Map<Long, String> sportNames = publicSportRepository.findAllById(
                        sessions.stream().map(ClassSession::getSportId).distinct().toList()).stream()
                .collect(Collectors.toMap(PublicSport::getSportId, PublicSport::getName));
        Map<Long, String> facilityNames = publicFacilityRepository.findAllById(
                        sessions.stream().map(ClassSession::getFacilityId).distinct().toList()).stream()
                .collect(Collectors.toMap(PublicFacility::getFacilityId, PublicFacility::getName));
        Map<Long, Long> bookedCounts = bookingRepository
                .findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES).stream()
                .collect(Collectors.groupingBy(Booking::getSessionId, Collectors.counting()));

        return sessions.stream().map(session -> new CoachScheduleEntryResponse(
                session.getSessionId(),
                session.getClassName(),
                sportNames.get(session.getSportId()),
                facilityNames.getOrDefault(session.getFacilityId(), "Địa điểm chưa cấu hình"),
                session.getStartTime(),
                session.getEndTime(),
                bookedCounts.getOrDefault(session.getSessionId(), 0L).intValue(),
                session.getMaxSlots(),
                session.getStatus())).toList();
    }

    @Transactional(readOnly = true)
    public List<CoachStudentBookingResponse> getCoachStudents(Long coachId) {
        List<ClassSession> sessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId).stream()
                .filter(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()))
                .toList();
        if (sessions.isEmpty()) {
            return List.of();
        }

        Map<Long, ClassSession> sessionsById = sessions.stream()
                .collect(Collectors.toMap(ClassSession::getSessionId, Function.identity()));
        List<Long> sessionIds = sessionsById.keySet().stream().toList();
        List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES);
        if (bookings.isEmpty()) {
            return List.of();
        }

        // Deduplicate bookings by memberId + sessionId to prevent duplicated student cards
        Map<String, Booking> distinctBookings = new LinkedHashMap<>();
        for (Booking booking : bookings) {
            String key = booking.getMemberId() + "_" + booking.getSessionId();
            distinctBookings.put(key, booking);
        }

        Map<Long, User> members = userRepository.findAllById(
                        distinctBookings.values().stream().map(Booking::getMemberId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        return distinctBookings.values().stream()
                .sorted((left, right) -> {
                    int sessionOrder = sessionsById.get(left.getSessionId()).getStartTime()
                            .compareTo(sessionsById.get(right.getSessionId()).getStartTime());
                    if (sessionOrder != 0) {
                        return sessionOrder;
                    }
                    return left.getBookingTime().compareTo(right.getBookingTime());
                })
                .map(booking -> {
                    ClassSession session = sessionsById.get(booking.getSessionId());
                    User member = members.get(booking.getMemberId());
                    return new CoachStudentBookingResponse(
                            booking.getBookingId(),
                            booking.getMemberId(),
                            member == null ? null : member.getFullName(),
                            member == null ? null : member.getPhone(),
                            member == null ? null : member.getEmail(),
                            member == null ? null : member.getAvatar(),
                            session.getSessionId(),
                            session.getClassName(),
                            session.getStartTime(),
                            booking.getStatus(),
                            booking.getAttendanceStatus() == null ? null : booking.getAttendanceStatus().name());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReceptionistClassResponse> getReceptionistSchedule(LocalDate weekStart) {
        LocalDateTime start = weekStart.atStartOfDay();
        LocalDateTime end = weekStart.plusDays(7).atStartOfDay();
        List<ClassSession> sessions = classSessionRepository
                .findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(start, end);
        if (sessions.isEmpty()) {
            return List.of();
        }

        List<Long> sessionIds = sessions.stream().map(ClassSession::getSessionId).toList();
        Map<Long, String> sportNames = publicSportRepository.findAllById(
                        sessions.stream().map(ClassSession::getSportId).distinct().toList()).stream()
                .collect(Collectors.toMap(PublicSport::getSportId, PublicSport::getName));
        Map<Long, String> facilityNames = publicFacilityRepository.findAllById(
                        sessions.stream().map(ClassSession::getFacilityId).distinct().toList()).stream()
                .collect(Collectors.toMap(PublicFacility::getFacilityId, PublicFacility::getName));
        Map<Long, String> coachNames = userRepository.findAllById(
                        sessions.stream().map(ClassSession::getCoachId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, User::getFullName));
        Map<Long, Long> bookedCounts = bookingRepository
                .findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES).stream()
                .collect(Collectors.groupingBy(Booking::getSessionId, Collectors.counting()));

        return sessions.stream().map(session -> new ReceptionistClassResponse(
                session.getSessionId(),
                session.getClassName(),
                sportNames.get(session.getSportId()),
                facilityNames.getOrDefault(session.getFacilityId(), "Địa điểm chưa cấu hình"),
                coachNames.get(session.getCoachId()),
                session.getSportId(),
                session.getStartTime(),
                session.getEndTime(),
                bookedCounts.getOrDefault(session.getSessionId(), 0L).intValue(),
                session.getMaxSlots(),
                session.getStatus())).toList();
    }

    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getClassesForSport(Long sportId, Long memberId) {
        PublicSport sport = getActiveSport(sportId);
        return getUpcomingClasses(memberId, "MEMBER").stream()
                .filter(session -> session.sportId().equals(sport.getSportId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourtSlotResponse> getAvailableCourtSlots(Long sportId) {
        PublicSport sport = getActiveSport(sportId);
        LocalDate today = LocalDate.now();
        LocalDateTime horizon = today.plusDays(14).atStartOfDay();
        return sportsCourtRepository.findBySportIdOrderByCourtIdAsc(sportId).stream()
                .flatMap(court -> {
                    LocalDateTime from = today.atStartOfDay();
                    List<CourtBooking> existingBookings = courtBookingRepository
                            .findByCourtIdAndStatusAndStartTimeBetween(court.getCourtId(), "CONFIRMED", from, horizon);
                    List<CourtMaintenance> maintenanceWindows = courtMaintenanceRepository
                            .findByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(court.getCourtId(), horizon, from);
                    return java.util.stream.Stream.iterate(today, date -> date.plusDays(1))
                            .limit(14)
                            .flatMap(date -> slotsForDay(court, sport, date, existingBookings, maintenanceWindows).stream());
                })
                .toList();
    }

    private List<CourtSlotResponse> slotsForDay(
            SportsCourt court,
            PublicSport sport,
            LocalDate date,
            List<CourtBooking> existingBookings,
            List<CourtMaintenance> maintenanceWindows) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slot = date.atTime(court.getOpensAt());
        LocalDateTime close = date.atTime(court.getClosesAt());
        List<CourtSlotResponse> slots = new java.util.ArrayList<>();
        boolean courtInactive = !court.isActive();
        while (!slot.plusHours(1).isAfter(close)) {
            LocalDateTime end = slot.plusHours(1);
            LocalDateTime candidate = slot;
            boolean occupied = existingBookings.stream().anyMatch(booking ->
                    booking.getStartTime().isBefore(end) && booking.getEndTime().isAfter(candidate));
            boolean underMaintenance = courtInactive || (maintenanceWindows != null && maintenanceWindows.stream().anyMatch(m ->
                    m.getStartTime().isBefore(end) && m.getEndTime().isAfter(candidate)));
            if (slot.isAfter(now)) {
                if (underMaintenance) {
                    slots.add(new CourtSlotResponse(
                            court.getCourtId(),
                            court.getCourtName(),
                            court.getDescription(),
                            sport.getName(),
                            court.getHourlyRate(),
                            slot,
                            end,
                            "MAINTENANCE"));
                } else if (!occupied) {
                    slots.add(new CourtSlotResponse(
                            court.getCourtId(),
                            court.getCourtName(),
                            court.getDescription(),
                            sport.getName(),
                            court.getHourlyRate(),
                            slot,
                            end,
                            "AVAILABLE"));
                }
            }
            slot = end;
        }
        return slots;
    }

    public record DiscountInfo(
            BigDecimal finalAmount,
            BigDecimal originalAmount,
            BigDecimal discountAmount,
            String discountLabel) {}

    public DiscountInfo calculateDiscount(Long memberId, String bookingType, BigDecimal originalAmount) {
        return new DiscountInfo(originalAmount, originalAmount, BigDecimal.ZERO, null);
    }

    @Transactional(readOnly = true)
    public BookingQuoteResponse getQuote(String bookingType, Long itemId, LocalDateTime startTime, LocalDateTime endTime) {
        return getQuote(bookingType, itemId, startTime, endTime, null);
    }

    @Transactional(readOnly = true)
    public BookingQuoteResponse getQuote(String bookingType, Long itemId, LocalDateTime startTime, LocalDateTime endTime, Long memberId) {
        String normalizedType = normalizeBookingType(bookingType);
        if ("COURT".equals(normalizedType)) {
            SportsCourt court = getActiveCourt(itemId);
            long hours = validateCourtSlot(court, startTime, endTime);
            if (courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(itemId, endTime, startTime)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân này đang trong lịch bảo trì, không thể đặt chỗ.");
            }
            if (courtBookingRepository.existsConfirmedOverlap(itemId, startTime, endTime)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Một hoặc nhiều khung giờ sân đã chọn vừa được người khác đặt.");
            }
            PublicSport sport = getActiveSport(court.getSportId());
            BigDecimal baseAmount = court.getHourlyRate().multiply(BigDecimal.valueOf(hours));
            DiscountInfo discount = calculateDiscount(memberId, "COURT", baseAmount);
            return new BookingQuoteResponse(
                    normalizedType, itemId, court.getCourtName(), sport.getName(),
                    court.getDescription(), startTime, endTime, discount.finalAmount(),
                    discount.originalAmount(), discount.discountAmount(), discount.discountLabel());
        }

        if ("PT".equals(normalizedType)) {
            User coach = userRepository.findById(itemId)
                    .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                    .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên."));

            LocalDateTime start = startTime != null ? startTime : LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
            LocalDateTime end = endTime != null ? endTime : start.plusHours(1);

            BigDecimal hourlyRate = BigDecimal.valueOf(250000);
            long minutes = Math.max(30, Duration.between(start, end).toMinutes());
            double hours = Math.max(1.0, minutes / 60.0);
            BigDecimal originalPrice = hourlyRate.multiply(BigDecimal.valueOf(hours)).setScale(0, RoundingMode.HALF_UP);

            DiscountInfo discount = calculateDiscount(memberId, "PT", originalPrice);
            return new BookingQuoteResponse(
                    "PT",
                    coach.getUserId(),
                    "Huấn luyện 1-1 với " + coach.getFullName(),
                    "Personal Training & Thể Lực",
                    "Khu Gym PT & Sân Chuyên Dụng",
                    start,
                    end,
                    discount.finalAmount(),
                    discount.originalAmount(),
                    discount.discountAmount(),
                    discount.discountLabel());
        }

        ClassSession session = getBookableClass(itemId);
        if (bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES)
                >= session.getMaxSlots()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học đã hết chỗ.");
        }
        PublicSport sport = getActiveSport(session.getSportId());
        PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId())
                .orElseThrow(() -> notFound("Không tìm thấy địa điểm lớp học."));
        if (!facility.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Địa điểm diễn ra lớp học hiện đang bảo trì, không thể đặt chỗ.");
        }
        User coach = userRepository.findById(session.getCoachId())
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên của lớp."));

        BigDecimal originalPrice = requirePrice(session.getPriceAmount());
        DiscountInfo discount = calculateDiscount(memberId, "CLASS", originalPrice);
        return new BookingQuoteResponse(
                normalizedType,
                itemId,
                session.getClassName(),
                sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(),
                session.getEndTime(),
                discount.finalAmount(),
                discount.originalAmount(),
                discount.discountAmount(),
                discount.discountLabel());
    }

    @Transactional
    public BookingConfirmationResponse checkout(Long memberId, CheckoutRequest request) {
        User member = userRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> notFound("Không tìm thấy tài khoản hội viên."));
        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn chưa được kích hoạt hoặc đang bị khóa.");
        }
        if ("COACH".equalsIgnoreCase(member.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản Huấn luyện viên không thể đặt chỗ như hội viên.");
        }

        if (request == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin đặt lịch.");
        if (!Boolean.TRUE.equals(request.useQuota()) && request.paymentMethod() != null
                && !List.of("VNPAY", "CASH", "CASH_COUNTER").contains(request.paymentMethod().toUpperCase(Locale.ROOT)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán không hợp lệ.");
        String bookingType = normalizeBookingType(request.bookingType());
        
        // Migration 002: Check useQuota flag with auto-check logic
        if (Boolean.TRUE.equals(request.useQuota())) {
            // Route to quota-based checkout
            if ("COURT".equals(bookingType)) {
                return checkoutCourtWithQuota(memberId, request);
            }
            if ("PT".equals(bookingType)) {
                return checkoutPtWithQuota(memberId, request);
            }
            return checkoutClassWithQuota(memberId, request);
        }
        
        // Giữ nguyên logic cũ (trả phí) - Backward compatible
        if ("COURT".equals(bookingType)) {
            return checkoutCourt(memberId, request);
        }
        if ("PT".equals(bookingType)) {
            return checkoutPt(memberId, request);
        }
        return checkoutClass(memberId, request);
    }

    private BookingConfirmationResponse checkoutPt(Long memberId, CheckoutRequest request) {
        User coach = userRepository.findByIdForUpdate(request.itemId())
                .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên."));

        LocalDateTime start = request.startTime() != null ? request.startTime() : LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        LocalDateTime end = request.endTime() != null ? request.endTime() : start.plusHours(1);

        LocalDateTime now = LocalDateTime.now();
        if (start == null || !start.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu buổi tập PT phải ở trong tương lai.");
        }
        if (end == null || !end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        if (coachAvailability != null) coachAvailability.requireAvailable(coach, start, end);
        if (classSessionRepository.existsOverlappingSessionForCoach(coach.getUserId(), start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Huấn luyện viên đã có lịch giảng dạy hoặc huấn luyện trong khung giờ này.");
        }
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học khác trong khung giờ này.");
        }
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch đặt sân thi đấu trong khung giờ này.");
        }

        BigDecimal hourlyRate = BigDecimal.valueOf(250000);
        long minutes = Math.max(30, Duration.between(start, end).toMinutes());
        double hours = Math.max(1.0, minutes / 60.0);
        BigDecimal originalPrice = hourlyRate.multiply(BigDecimal.valueOf(hours)).setScale(0, RoundingMode.HALF_UP);

        DiscountInfo discount = calculateDiscount(memberId, "PT", originalPrice);
        PaymentTransaction payment = createRetailPayment(memberId, "PT", null, discount.finalAmount(), request);

        List<ClassSession> coachSessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coach.getUserId());
        Long sportId = coachSessions.stream()
                .map(ClassSession::getSportId)
                .filter(id -> id != null)
                .findFirst()
                .orElseGet(() -> publicSportRepository.findAll().stream().map(PublicSport::getSportId).findFirst().orElse(1L));
        Long facilityId = coachSessions.stream()
                .map(ClassSession::getFacilityId)
                .filter(id -> id != null)
                .findFirst()
                .orElseGet(() -> publicFacilityRepository.findAll().stream().map(PublicFacility::getFacilityId).findFirst().orElse(1L));

        ClassSession session = new ClassSession();
        session.setClassName("Huấn Luyện 1-1 (" + coach.getFullName() + ")");
        session.setSportId(sportId);
        session.setCoachId(coach.getUserId());
        session.setFacilityId(facilityId);
        session.setStartTime(start);
        session.setEndTime(end);
        session.setMaxSlots(1);
        session.setBookedSlots(1);
        session.setPriceAmount(payment.getAmount());
        session.setStatus("SCHEDULED");
        ClassSession savedSession = classSessionRepository.save(session);

        Booking booking = new Booking();
        booking.setMemberId(memberId);
        booking.setSessionId(savedSession.getSessionId());
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("PAID".equals(payment.getPaymentStatus()) ? "CONFIRMED" : "BOOKED");
        booking.setAttendanceStatus(AttendanceStatus.PENDING);
        booking.setFeeAmount(payment.getAmount());
        booking.setPaymentId(payment.getPaymentId());
        booking.setCoachNote("Buổi tập cá nhân 1-1");
        Booking savedBooking = bookingRepository.save(booking);

        PublicSport sport = publicSportRepository.findById(sportId).orElse(null);
        PublicFacility facility = publicFacilityRepository.findById(facilityId).orElse(null);
        String sportName = sport != null ? sport.getName() : "Personal Training & Thể Lực";
        String facilityName = (facility != null ? facility.getName() : "Khu Gym PT & Sân Chuyên Dụng") + " · HLV " + coach.getFullName();

        return new BookingConfirmationResponse(
                "PT",
                savedBooking.getBookingId(),
                payment.getPaymentId(),
                savedSession.getClassName(),
                sportName,
                facilityName,
                start,
                end,
                payment.getAmount(),
                payment.getPaymentStatus(),
                payment.getReferenceCode());
    }

    private BookingConfirmationResponse checkoutCourt(Long memberId, CheckoutRequest request) {
        // 1. Lock court to prevent concurrent modifications
        SportsCourt court = sportsCourtRepository.findByIdForUpdate(request.itemId())
                .orElseThrow(() -> notFound("Không tìm thấy sân thể thao."));
        if (!court.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân này đang trong lịch bảo trì, tạm thời không nhận đặt chỗ.");
        }
        
        // 2. Validate time slot
        long hours = validateCourtSlot(court, request.startTime(), request.endTime());
        
        // 3. Check maintenance schedule
        if (courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(court.getCourtId(), request.endTime(), request.startTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân này đang trong lịch bảo trì, không thể đặt chỗ.");
        }
        
        // 4. BR-COURT-01: Check court availability (prevent double booking)
        if (courtBookingRepository.existsConfirmedOverlap(court.getCourtId(), request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Sân này đã được đặt trong khung giờ bạn chọn. Vui lòng chọn sân khác hoặc thời gian khác.");
        }
        
        // 5. BR-COURT-02: Check member concurrent court limit (max 3 courts at same time)
        long memberConcurrentCourts = courtBookingRepository.countMemberConcurrentCourts(
            memberId, request.startTime(), request.endTime()
        );
        if (memberConcurrentCourts >= 3) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Bạn đã đặt tối đa 3 sân trong cùng khung giờ này. " +
                "Vui lòng chọn thời gian khác hoặc hủy một trong các sân đã đặt.");
        }
        
        // 6. Check time conflicts with class bookings
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học trong khung giờ này.");
        }
        
        // 7. Check time conflicts with other court bookings
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có một lịch đặt sân khác trong khung giờ này.");
        }
        PublicSport sport = getActiveSport(court.getSportId());
        BigDecimal baseAmount = court.getHourlyRate().multiply(BigDecimal.valueOf(hours));
        DiscountInfo discount = calculateDiscount(memberId, "COURT", baseAmount);
        
        // Store court details for transaction history: "Sân Cầu Lông 01 (Thể Thao FPT)"
        String courtDescription = court.getCourtName() + " (" + sport.getName() + ")";
        PaymentTransaction payment = createRetailPayment(memberId, "COURT", courtDescription, discount.finalAmount(), request);

        CourtBooking booking = new CourtBooking();
        booking.setMemberId(memberId);
        booking.setCourtId(court.getCourtId());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setAmountPaid(payment.getAmount());
        booking.setPaymentId(payment.getPaymentId());
        // NEW: Set PENDING first, only CONFIRMED after payment success
        booking.setStatus("PAID".equals(payment.getPaymentStatus()) ? "CONFIRMED" : "PENDING");
        booking.setCreatedAt(LocalDateTime.now());
        CourtBooking saved = courtBookingRepository.save(booking);
        return new BookingConfirmationResponse(
                "COURT", saved.getCourtBookingId(), payment.getPaymentId(),
                court.getCourtName(), sport.getName(), court.getDescription(),
                saved.getStartTime(), saved.getEndTime(), saved.getAmountPaid(),
                payment.getPaymentStatus(), payment.getReferenceCode());
    }

    private BookingConfirmationResponse checkoutClass(Long memberId, CheckoutRequest request) {
        // 1. Lock session first (prevent concurrent modifications)
        ClassSession session = classSessionRepository.findByIdForUpdate(request.itemId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        validateBookableClass(session);
        
        // 2. Check duplicate booking for this member
        if (bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(memberId, session.getSessionId(), ALL_ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt chỗ hoặc đang trong hàng đợi lớp này.");
        }
        
        // 3. BR-CLASS-01: Check slot availability with lock (prevent race condition)
        long currentBookedCount = bookingRepository.countActiveBookingsWithLock(session.getSessionId(), ACTIVE_STATUSES);
        if (currentBookedCount >= session.getMaxSlots()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Lớp học đã hết chỗ. Vui lòng chọn lớp khác hoặc thời gian khác.");
        }
        
        // 4. Check time conflicts with other bookings
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, session.getStartTime(), session.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học khác trong khung giờ này.");
        }
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, session.getStartTime(), session.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch đặt sân thi đấu trong khung giờ này.");
        }

        BigDecimal originalPrice = requirePrice(session.getPriceAmount());
        DiscountInfo discount = calculateDiscount(memberId, "CLASS", originalPrice);
        PublicSport sport = getActiveSport(session.getSportId());
        PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId())
                .orElseThrow(() -> notFound("Không tìm thấy địa điểm lớp học."));
        if (!facility.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Địa điểm diễn ra lớp học hiện đang bảo trì, không thể đặt chỗ.");
        }
        User coach = userRepository.findById(session.getCoachId())
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên của lớp."));
        
        // Store class details for transaction history: "Yoga Cơ Bản - HLV Nguyễn Văn A"
        String classDescription = session.getClassName() + " - HLV " + coach.getFullName();
        PaymentTransaction payment = createRetailPayment(memberId, "CLASS", classDescription, discount.finalAmount(), request);

        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(session.getSessionId())
                .bookingTime(LocalDateTime.now())
                // Database constraint: BOOKED, WAITLIST, CANCELLED only
                // Payment tracking via payment_transactions.payment_status (PENDING/PAID)
                .status("PAID".equals(payment.getPaymentStatus()) ? "CONFIRMED" : "BOOKED")
                .attendanceStatus(AttendanceStatus.PENDING)
                .feeAmount(payment.getAmount())
                .paymentId(payment.getPaymentId())
                .build();
        Booking saved = bookingRepository.save(booking);
        session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES));
        classSessionRepository.save(session);
        return new BookingConfirmationResponse(
                "CLASS", saved.getBookingId(), payment.getPaymentId(),
                session.getClassName(), sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(), session.getEndTime(), payment.getAmount(),
                payment.getPaymentStatus(), payment.getReferenceCode());
    }

    /**
     * Checkout CLASS với quota (useQuota = true)
     * Theo DATABASE_SCHEMA_SPECIFICATION.md Section 5.1
     */
    @Transactional
    private BookingConfirmationResponse checkoutClassWithQuota(Long memberId, CheckoutRequest request) {
        // 1. Lock session first (prevent concurrent modifications)
        ClassSession session = classSessionRepository.findByIdForUpdate(request.itemId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        validateBookableClass(session);
        
        // 2. Check duplicate booking
        if (bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(memberId, session.getSessionId(), ALL_ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt chỗ hoặc đang trong hàng đợi lớp này.");
        }
        
        // 3. BR-CLASS-01: Check slot availability with lock (prevent race condition)
        long currentBookedCount = bookingRepository.countActiveBookingsWithLock(session.getSessionId(), ACTIVE_STATUSES);
        if (currentBookedCount >= session.getMaxSlots()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Lớp học đã hết chỗ. Vui lòng chọn lớp khác hoặc thời gian khác.");
        }
        
        // 4. Check time conflicts
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, session.getStartTime(), session.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học khác trong khung giờ này.");
        }
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, session.getStartTime(), session.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch đặt sân thi đấu trong khung giờ này.");
        }
        
        // 5. Find membership with quota (Rule: remaining_quota_sessions >= 1)
        UserMembership membership = membershipService.getActiveMembershipWithQuota(memberId, 1, "CLASS", session.getSportId());
        if (membership == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Không có gói membership còn quota. Vui lòng chọn thanh toán giá lẻ.");
        }
        
        // 6. Hold quota (remaining → held)
        membershipService.holdQuota(membership.getMembershipId(), 1);
        
        // 6.5. Create 0đ payment transaction for quota tracking & refund support
        PublicSport sport = getActiveSport(session.getSportId());
        PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId())
                .orElseThrow(() -> notFound("Không tìm thấy địa điểm lớp học."));
        User coach = userRepository.findById(session.getCoachId())
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên."));
        
        // Store class details for transaction history: "Yoga Cơ Bản - HLV Nguyễn Văn A"
        String classDescription = session.getClassName() + " - HLV " + coach.getFullName();
        
        // Create payment transaction với amount=0, method=MEMBERSHIP_QUOTA
        PaymentTransaction payment = createPaymentTransaction(
            memberId, 
            "CLASS", 
            classDescription,
            BigDecimal.ZERO,  // amount = 0đ (dùng quota)
            "MEMBERSHIP_QUOTA"  // payment method
        );
        
        // 7. Create booking with quota (now has payment_id for refund support)
        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(session.getSessionId())
                .bookingTime(LocalDateTime.now())
                .status("CONFIRMED")  // Xác nhận NGAY (không timeout) theo spec
                .attendanceStatus(AttendanceStatus.PENDING)
                .usesMembershipQuota(true).quotaState("HELD")  // FLAG quan trọng
                .membershipId(membership.getMembershipId())
                .feeAmount(BigDecimal.ZERO)  // 0đ vì dùng quota
                .paymentId(payment.getPaymentId())  // ✅ Now has payment for refund flow
                .build();
        Booking saved = bookingRepository.save(booking);
        
        // 8. Update booked slots
        session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES));
        classSessionRepository.save(session);
        
        // 9. Return response with quota info
        return new BookingConfirmationResponse(
                "CLASS",
                saved.getBookingId(),
                payment.getPaymentId(),  // ✅ Return payment ID
                session.getClassName(),
                sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(),
                session.getEndTime(),
                BigDecimal.ZERO,  // Paid 0đ
                "PAID",  // Status = PAID (vì dùng quota, không cần VNPay callback)
                payment.getReferenceCode(),  // ✅ Return reference code
                true,  // usedQuota = true
                1,  // quotaUsed = 1
                membership.getRemainingQuotaSessions(),  // quotaRemaining after hold
                String.format("Đã dùng 1 buổi quota. Còn %d buổi.", 
                    membership.getRemainingQuotaSessions())
        );
    }

    /**
     * Checkout PT với quota (useQuota = true)
     * Tương tự checkoutClassWithQuota nhưng cho PT 1-1
     */
    @Transactional
    private BookingConfirmationResponse checkoutPtWithQuota(Long memberId, CheckoutRequest request) {
        // 1. Validate coach
        User coach = userRepository.findByIdForUpdate(request.itemId())
                .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên."));

        // 2. Validate time
        LocalDateTime start = request.startTime() != null ? request.startTime() : LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        LocalDateTime end = request.endTime() != null ? request.endTime() : start.plusHours(1);

        LocalDateTime now = LocalDateTime.now();
        if (start == null || !start.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu buổi tập PT phải ở trong tương lai.");
        }
        if (end == null || !end.isAfter(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        // 3. Check time conflicts
        if (coachAvailability != null) coachAvailability.requireAvailable(coach, start, end);
        if (classSessionRepository.existsOverlappingSessionForCoach(coach.getUserId(), start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Huấn luyện viên đã có lịch giảng dạy hoặc huấn luyện trong khung giờ này.");
        }
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học khác trong khung giờ này.");
        }
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch đặt sân thi đấu trong khung giờ này.");
        }

        // 4. Find membership with quota
        UserMembership membership = membershipService.getActiveMembershipWithQuota(memberId, 1, "PT", classSessionRepository.findByCoachIdOrderByStartTimeAsc(coach.getUserId()).stream().map(ClassSession::getSportId).filter(java.util.Objects::nonNull).findFirst().orElse(null));
        if (membership == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Không có gói membership còn quota. Vui lòng chọn thanh toán giá lẻ.");
        }
        
        // 5. Hold quota (remaining → held)
        membershipService.holdQuota(membership.getMembershipId(), 1);

        // 5.5. Create 0đ payment transaction for quota tracking
        String ptDescription = "Huấn Luyện 1-1 (" + coach.getFullName() + ")";
        
        PaymentTransaction payment = createPaymentTransaction(
            memberId,
            "PT",
            ptDescription,
            BigDecimal.ZERO,
            "MEMBERSHIP_QUOTA"
        );

        // 6. Create PT session
        List<ClassSession> coachSessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coach.getUserId());
        Long sportId = coachSessions.stream()
                .map(ClassSession::getSportId)
                .filter(id -> id != null)
                .findFirst()
                .orElseGet(() -> publicSportRepository.findAll().stream().map(PublicSport::getSportId).findFirst().orElse(1L));
        Long facilityId = coachSessions.stream()
                .map(ClassSession::getFacilityId)
                .filter(id -> id != null)
                .findFirst()
                .orElseGet(() -> publicFacilityRepository.findAll().stream().map(PublicFacility::getFacilityId).findFirst().orElse(1L));

        ClassSession session = new ClassSession();
        session.setClassName("Huấn Luyện 1-1 (" + coach.getFullName() + ")");
        session.setSportId(sportId);
        session.setCoachId(coach.getUserId());
        session.setFacilityId(facilityId);
        session.setStartTime(start);
        session.setEndTime(end);
        session.setMaxSlots(1);
        session.setBookedSlots(1);
        session.setPriceAmount(BigDecimal.ZERO);  // 0đ vì dùng quota
        session.setStatus("SCHEDULED");
        ClassSession savedSession = classSessionRepository.save(session);

        // 7. Create booking with quota (now has payment_id)
        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(savedSession.getSessionId())
                .bookingTime(LocalDateTime.now())
                .status("CONFIRMED")  // Xác nhận NGAY
                .attendanceStatus(AttendanceStatus.PENDING)
                .usesMembershipQuota(true).quotaState("HELD")
                .membershipId(membership.getMembershipId())
                .feeAmount(BigDecimal.ZERO)
                .paymentId(payment.getPaymentId())  // ✅ Now has payment
                .coachNote("Buổi tập cá nhân 1-1 (Dùng quota)")
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        // 8. Get display info
        PublicSport sport = publicSportRepository.findById(sportId).orElse(null);
        PublicFacility facility = publicFacilityRepository.findById(facilityId).orElse(null);
        String sportName = sport != null ? sport.getName() : "Personal Training & Thể Lực";
        String facilityName = (facility != null ? facility.getName() : "Khu Gym PT & Sân Chuyên Dụng") + " · HLV " + coach.getFullName();

        // 9. Return response with quota info
        return new BookingConfirmationResponse(
                "PT",
                savedBooking.getBookingId(),
                payment.getPaymentId(),  // ✅ Return payment ID
                savedSession.getClassName(),
                sportName,
                facilityName,
                start,
                end,
                BigDecimal.ZERO,
                "PAID",
                payment.getReferenceCode(),  // ✅ Return reference code
                true,  // usedQuota
                1,  // quotaUsed
                membership.getRemainingQuotaSessions(),
                String.format("Đã dùng 1 buổi quota. Còn %d buổi.", 
                    membership.getRemainingQuotaSessions())
        );
    }

    /**
     * ✅ DEPRECATED: Use PaymentService.createPayment() instead
     * Kept for backward compatibility if needed
     */
    private PaymentTransaction createRetailPayment(Long memberId, String type, String description, BigDecimal amount, CheckoutRequest request) {
        PaymentTransaction payment = createPaymentTransaction(memberId, type, description, amount, request.paymentMethod());
        if (request.voucherCode() != null && !request.voucherCode().isBlank()) {
            if (voucherService == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Dịch vụ voucher chưa sẵn sàng.");
            voucherService.apply(payment, request.voucherCode());
        }
        return payment;
    }

    private PaymentTransaction createPaymentTransaction(Long memberId, String bookingType, BigDecimal amount, String paymentMethod) {
        return createPaymentTransaction(memberId, bookingType, null, amount, paymentMethod);
    }

    private PaymentTransaction createPaymentTransaction(Long memberId, String bookingType, String itemDescription, BigDecimal amount, String paymentMethod) {
        PaymentService service = paymentService != null ? paymentService : new PaymentService(paymentTransactionRepository);
        return service.createPayment(memberId, bookingType, itemDescription, amount, paymentMethod);
    }

    @Transactional(readOnly = true)
    public List<MemberScheduleEntryResponse> getMemberScheduleEntries(Long memberId) {
        List<Booking> classBookings = bookingRepository.findByMemberId(memberId);
        Map<Long, ClassSession> classes = classSessionRepository.findAllById(
                        classBookings.stream().map(Booking::getSessionId).distinct().toList()).stream()
                .collect(Collectors.toMap(ClassSession::getSessionId, Function.identity()));
        Map<Long, User> coaches = userRepository.findAllById(
                        classes.values().stream().map(ClassSession::getCoachId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));

        Map<String, String> refundStatusMap = new java.util.HashMap<>();
        if (refundRequestRepository != null) {
            List<com.sporthub.backend.entity.RefundRequest> refundRequests = 
                refundRequestRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
            for (com.sporthub.backend.entity.RefundRequest r : refundRequests) {
                if (r.getBookingId() != null && r.getBookingType() != null) {
                    if ("PENDING_APPROVAL".equals(r.getStatus()) || "APPROVED".equals(r.getStatus()) || "REFUNDED".equals(r.getStatus())) {
                        refundStatusMap.putIfAbsent(r.getBookingType().toUpperCase(Locale.ROOT) + "_" + r.getBookingId(), r.getStatus());
                    }
                }
            }
        }

        List<MemberScheduleEntryResponse> entries = classBookings.stream()
                .filter(booking -> classes.containsKey(booking.getSessionId()) && !"CANCELLED".equalsIgnoreCase(booking.getStatus()))
                .map(booking -> {
                    ClassSession session = classes.get(booking.getSessionId());
                    PublicSport sport = publicSportRepository.findById(session.getSportId()).orElse(null);
                    PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId()).orElse(null);
                    User coach = coaches.get(session.getCoachId());
                    boolean isCancelled = "CANCELLED".equalsIgnoreCase(booking.getStatus());
                    String refundStatus = refundStatusMap.get("CLASS_" + booking.getBookingId());
                    if (refundStatus == null && isCancelled) {
                        refundStatus = "REFUNDED";
                    }
                    if ("APPROVED".equalsIgnoreCase(refundStatus) || "REFUNDED".equalsIgnoreCase(refundStatus)) {
                        return null;
                    }

                    boolean isMaintenanceAffected = false;
                    if (session.getFacilityId() != null && syncService != null) {
                        List<Long> courtIds = syncService.getCourtIdsForFacility(session.getFacilityId(), session.getSportId(), null);
                        for (Long cId : courtIds) {
                            if (courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                                    cId, session.getEndTime(), session.getStartTime())) {
                                isMaintenanceAffected = true;
                                break;
                            }
                        }
                    }

                    return new MemberScheduleEntryResponse(
                            "CLASS",
                            booking.getBookingId(),
                            session.getClassName(),
                            sport == null ? "Bộ môn" : sport.getName(),
                            facility == null ? "Địa điểm" : facility.getName(),
                            session.getStartTime(),
                            session.getEndTime(),
                            booking.getFeeAmount(),
                            booking.getStatus(),
                            coach == null ? null : coach.getUserId(),
                            coach == null ? "Huấn luyện viên" : coach.getFullName(),
                            coach == null ? null : coach.getPhone(),
                            coach == null ? null : coach.getAvatar(),
                            booking.getAttendanceStatus() == null ? null : booking.getAttendanceStatus().name(),
                            booking.getCoachNote(),
                            refundStatus,
                            isMaintenanceAffected);
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(java.util.ArrayList::new));

        List<CourtBooking> courtBookings = courtBookingRepository.findByMemberIdOrderByStartTimeAsc(memberId);
        Map<Long, SportsCourt> courts = sportsCourtRepository.findAllById(
                        courtBookings.stream().map(CourtBooking::getCourtId).distinct().toList()).stream()
                .collect(Collectors.toMap(SportsCourt::getCourtId, Function.identity()));
        for (CourtBooking booking : courtBookings) {
            if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) continue;
            SportsCourt court = courts.get(booking.getCourtId());
            if (court == null) continue;
            PublicSport sport = publicSportRepository.findById(court.getSportId()).orElse(null);
            boolean isCancelled = "CANCELLED".equalsIgnoreCase(booking.getStatus());
            String refundStatus = refundStatusMap.get("COURT_" + booking.getCourtBookingId());
            if (refundStatus == null && isCancelled) {
                refundStatus = "REFUNDED";
            }
            if ("APPROVED".equalsIgnoreCase(refundStatus) || "REFUNDED".equalsIgnoreCase(refundStatus)) {
                continue;
            }

            boolean isMaintenanceAffected = courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                    booking.getCourtId(), booking.getEndTime(), booking.getStartTime());

            entries.add(new MemberScheduleEntryResponse(
                    "COURT",
                    booking.getCourtBookingId(),
                    court.getCourtName(),
                    sport == null ? "Bộ môn" : sport.getName(),
                    court.getDescription(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getAmountPaid(),
                    booking.getStatus(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    refundStatus,
                    isMaintenanceAffected));
        }
        entries.sort((left, right) -> left.startTime().compareTo(right.startTime()));
        return entries;
    }

    private ClassSession getBookableClass(Long sessionId) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        validateBookableClass(session);
        return session;
    }

    private void validateBookableClass(ClassSession session) {
        if (!"SCHEDULED".equalsIgnoreCase(session.getStatus())
                || session.getStartTime() == null
                || !session.getStartTime().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học không còn mở đăng ký.");
        }
        if (session.getFacilityId() != null && facilityRepository != null) {
            facilityRepository.findById(session.getFacilityId()).ifPresent(f -> {
                if ("MAINTENANCE".equalsIgnoreCase(f.getStatus())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Cơ sở vật chất của lớp học này đang trong thời gian bảo trì, tạm thời không nhận đăng ký.");
                }
            });
        }
        requirePrice(session.getPriceAmount());
    }

    private long validateCourtSlot(SportsCourt court, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian đặt sân không hợp lệ.");
        }
        if (!startTime.toLocalDate().equals(endTime.toLocalDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lượt đặt sân phải nằm trong cùng một ngày.");
        }
        long minutes = Duration.between(startTime, endTime).toMinutes();
        if (minutes < 60 || minutes % 60 != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời lượng đặt sân phải theo từng khung 60 phút liên tiếp (1 giờ, 2 giờ, 3 giờ...).");
        }
        LocalDateTime now = LocalDateTime.now();
        if (!startTime.isAfter(now) || startTime.isAfter(now.plusDays(14))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể đặt sân trong 14 ngày tới.");
        }
        if (!startTime.toLocalTime().equals(startTime.toLocalTime().withMinute(0).withSecond(0).withNano(0))
                || !endTime.toLocalTime().equals(endTime.toLocalTime().withMinute(0).withSecond(0).withNano(0))
                || endTime.toLocalTime().isAfter(court.getClosesAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ sân không hợp lệ.");
        }
        if (startTime.toLocalTime().isBefore(court.getOpensAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ nằm ngoài giờ hoạt động của sân.");
        }
        return minutes / 60;
    }

    private String normalizeBookingType(String bookingType) {
        String normalized = bookingType == null ? "" : bookingType.trim().toUpperCase(Locale.ROOT);
        if (!List.of("COURT", "CLASS", "PT").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại booking phải là COURT, CLASS hoặc PT.");
        }
        return normalized;
    }

    private BigDecimal requirePrice(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giá booking chưa được cấu hình.");
        }
        return amount;
    }

    private PublicSport getActiveSport(Long sportId) {
        return publicSportRepository.findById(sportId)
                .filter(PublicSport::isActive)
                .orElseThrow(() -> notFound("Không tìm thấy bộ môn đang hoạt động."));
    }

    private SportsCourt getActiveCourt(Long courtId) {
        SportsCourt court = sportsCourtRepository.findById(courtId)
                .orElseThrow(() -> notFound("Không tìm thấy sân thể thao."));
        if (!court.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân/Làn bơi này đang trong lịch bảo trì, tạm thời không nhận đặt chỗ.");
        }
        return court;
    }

    @Transactional(readOnly = true)
    public List<Booking> getMemberSchedule(Long memberId) {
        return bookingRepository.findByMemberIdAndStatusIn(memberId, ALL_ACTIVE_STATUSES);
    }

    // Get session roster - includes both BOOKED and CONFIRMED bookings
    // Chi tiết: PAYMENT_FLOW_DOCUMENTATION.md - Rule 9
    @Transactional(readOnly = true)
    public List<RosterBookingResponse> getSessionRoster(Long sessionId, Long actorId, String actorRole) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        if ("COACH".equals(actorRole) && !session.getCoachId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công lớp học này.");
        }
        List<Booking> bookings = bookingRepository
                .findBySessionIdAndStatusInOrderByBookingTimeAsc(sessionId, ACTIVE_STATUSES);
        Map<Long, User> members = userRepository.findAllById(
                        bookings.stream().map(Booking::getMemberId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        return bookings.stream().map(booking -> {
            User member = members.get(booking.getMemberId());
            return new RosterBookingResponse(
                    booking.getBookingId(),
                    booking.getMemberId(),
                    member == null ? null : member.getFullName(),
                    member == null ? null : member.getPhone(),
                    booking.getStatus(),
                    booking.getAttendanceStatus() == null ? null : booking.getAttendanceStatus().name(),
                    booking.getCoachNote());
        }).toList();
    }

    @Transactional(readOnly = true)
    public CoachPublicProfileResponse getCoachPublicProfile(Long coachId) {
        User coach = userRepository.findById(coachId)
                .filter(user -> "COACH".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> notFound("Không tìm thấy thông tin huấn luyện viên."));

        List<ClassSession> coachSessions = classSessionRepository.findAll().stream()
                .filter(session -> java.util.Objects.equals(session.getCoachId(), coachId))
                .filter(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()))
                .toList();

        List<Long> sportIds = coachSessions.stream().map(ClassSession::getSportId).distinct().toList();
        List<String> sportsTaught = sportIds.isEmpty() ? List.of("Đào tạo thể thao") :
                publicSportRepository.findAllById(sportIds).stream().map(PublicSport::getName).toList();

        return new CoachPublicProfileResponse(
                coach.getUserId(),
                coach.getFullName(),
                coach.getEmail(),
                coach.getPhone(),
                coach.getAvatar(),
                "Huấn luyện viên Chuyên Nghiệp F Sport Center",
                coach.getAddress() != null && !coach.getAddress().isBlank() ? coach.getAddress() :
                        "Huấn luyện viên đạt chứng chỉ chuyên môn quốc tế với nhiều năm kinh nghiệm huấn luyện học viên tại F Sport Center.",
                coachSessions.size(),
                sportsTaught);
    }

    @Transactional(readOnly = true)
    public List<CoachPublicProfileResponse> getAllCoachesPublicProfiles() {
        return userRepository.findAll().stream()
                .filter(u -> "COACH".equalsIgnoreCase(u.getRole()) && "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .map(coach -> getCoachPublicProfile(coach.getUserId()))
                .toList();
    }

    @Transactional
    public Booking updateAttendance(Long bookingId, Long actorId, String actorRole, String status, String coachNote) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        
        // Chấp nhận 4 trạng thái theo DATABASE.md Section 5.4
        if (!List.of("PRESENT", "EXCUSED_ABSENCE", "UNEXCUSED_ABSENCE", "ABSENT").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Trạng thái điểm danh phải là PRESENT, EXCUSED_ABSENCE, UNEXCUSED_ABSENCE hoặc ABSENT.");
        }
        
        // Convert String to AttendanceStatus enum
        AttendanceStatus attendanceStatus;
        switch (normalizedStatus) {
            case "PRESENT" -> attendanceStatus = AttendanceStatus.PRESENT;
            case "EXCUSED_ABSENCE" -> attendanceStatus = AttendanceStatus.EXCUSED_ABSENCE;
            case "UNEXCUSED_ABSENCE", "ABSENT" -> attendanceStatus = AttendanceStatus.UNEXCUSED_ABSENCE;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        }
        
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> notFound("Không tìm thấy thông tin đặt chỗ."));
        ClassSession session = classSessionRepository.findById(booking.getSessionId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học liên quan."));
        
        if (!List.of("COACH", "RECEPTIONIST", "MANAGER", "ADMIN").contains(actorRole)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (!"CONFIRMED".equals(booking.getStatus()) || session.getStartTime() == null || session.getStartTime().isAfter(LocalDateTime.now())
                || (booking.getPaymentId() != null && paymentTransactionRepository.findById(booking.getPaymentId()).filter(p -> "PAID".equals(p.getPaymentStatus())).isEmpty()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ điểm danh buổi đã đến giờ và đã thanh toán.");
        // ✅ Lưu trạng thái cũ để check permission
        AttendanceStatus oldStatus = booking.getAttendanceStatus();
        
        // ✅ Permission check: RECEPTIONIST chỉ được SỬA điểm danh, KHÔNG được TẠO lần đầu
        if ("RECEPTIONIST".equals(actorRole) && (oldStatus == null || oldStatus == AttendanceStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "Lễ tân không được tạo điểm danh lần đầu. Chỉ Coach được điểm danh cho lớp/PT (BR-14).");
        }
        
        // ✅ Permission check: COACH chỉ điểm danh lớp MÌNH phụ trách
        if ("COACH".equals(actorRole) && !session.getCoachId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "Bạn không được phân công lớp học này.");
        }
        
        // ✅ Validate: Booking phải ACTIVE
        if (!ACTIVE_STATUSES.contains(booking.getStatus().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Chỉ đặt chỗ đã xác nhận mới được điểm danh.");
        }

        String absenceTag = switch (normalizedStatus) {
            case "EXCUSED_ABSENCE" -> "[Vắng có phép]";
            case "UNEXCUSED_ABSENCE", "ABSENT" -> "[Vắng không phép]";
            default -> null;
        };
        booking.setAttendanceStatus(attendanceStatus);
        if (coachNote != null || absenceTag != null) {
            String note = coachNote == null ? "" : coachNote.trim().replaceFirst("^\\[Vắng (có|không) phép\\]\\s*", "");
            booking.setCoachNote(absenceTag == null ? note : (absenceTag + " " + note).trim());
        }
        if (Boolean.TRUE.equals(booking.getUsesMembershipQuota()) && booking.getMembershipId() != null)
            membershipService.settleAttendanceQuota(booking, oldStatus, attendanceStatus, session.getStartTime());
        Booking saved = bookingRepository.save(booking);
        if (engagementService != null) engagementService.audit(actorId, actorRole, "ATTENDANCE_UPDATED",
            "bookingId=" + bookingId + ", before=" + oldStatus + ", after=" + attendanceStatus + ", quota=" + booking.getQuotaState());
        return saved;
    }

    // ==================== CANCEL BOOKING METHODS (LUỒNG 1) ====================
    
    /**
     * LUỒNG 1: Cancel CLASS booking (trước giờ học >= 2h) - Hoàn quota/hủy trực tiếp nếu không trả tiền, hoặc tạo RefundRequest nếu đã thanh toán
     */
    @Transactional
    public CancelBookingResponse cancelClassBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId).orElseThrow(() -> notFound("Không tìm thấy booking."));
        if (!booking.getMemberId().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if ("CANCELLED".equals(booking.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch đã hủy.");
        ClassSession session = classSessionRepository.findByIdForUpdate(booking.getSessionId()).orElseThrow(() -> notFound("Không tìm thấy buổi học."));
        if (!session.getStartTime().isAfter(LocalDateTime.now())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Buổi học đã bắt đầu.");
        if (booking.getAttendanceStatus() != null && booking.getAttendanceStatus() != AttendanceStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Buổi học đã được điểm danh.");
        boolean timely = !session.getStartTime().minusHours(2).isBefore(LocalDateTime.now()) || "CANCELLED".equals(session.getStatus()) || isSessionUnderMaintenance(session);
        if (Boolean.TRUE.equals(booking.getUsesMembershipQuota()) && booking.getMembershipId() != null) {
            if (timely) membershipService.refundQuotaForExcusedAbsence(booking.getMembershipId(), 1, session.getStartTime());
            else membershipService.consumeQuota(booking.getMembershipId(), 1);
            booking.setQuotaState(timely ? "RELEASED" : "USED");
        }
        booking.setStatus("CANCELLED"); bookingRepository.save(booking);
        releasePtSession(booking, session);
        session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES));
        classSessionRepository.save(session);
        return cancellationResult("CLASS", bookingId, userId, booking.getPaymentId(), session.getClassName(), session.getStartTime(), timely);
    }

    @Transactional
    public CancelBookingResponse cancelCourtBooking(Long id, Long userId) {
        CourtBooking booking = courtBookingRepository.findByIdForUpdate(id).orElseThrow(() -> notFound("Không tìm thấy đặt sân."));
        if (!booking.getMemberId().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (!List.of("PENDING", "CONFIRMED").contains(booking.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch không thể hủy.");
        boolean timely = !booking.getStartTime().minusHours(2).isBefore(LocalDateTime.now())
            || courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(booking.getCourtId(), booking.getEndTime(), booking.getStartTime());
        if (Boolean.TRUE.equals(booking.getUsesMembershipQuota()) && booking.getMembershipId() != null) {
            double hours = booking.getQuotaHoursUsed().doubleValue();
            if (timely) membershipService.releaseCourtQuota(booking.getMembershipId(), hours);
            else membershipService.consumeCourtQuota(booking.getMembershipId(), hours);
            booking.setQuotaState(timely ? "RELEASED" : "USED");
        }
        booking.setStatus("CANCELLED"); courtBookingRepository.save(booking);
        String title = sportsCourtRepository.findById(booking.getCourtId()).map(SportsCourt::getCourtName).orElse("Sân thể thao");
        return cancellationResult("COURT", id, userId, booking.getPaymentId(), title, booking.getStartTime(), timely);
    }

    private CancelBookingResponse cancellationResult(String type, Long id, Long user, Long paymentId, String title, LocalDateTime start, boolean timely) {
        PaymentTransaction payment = paymentId == null ? null : paymentTransactionRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment != null && "PAID".equals(payment.getPaymentStatus()) && payment.getAmount().signum() > 0 && timely) {
            if (refundRequestRepository == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Dịch vụ hoàn tiền chưa sẵn sàng.");
            List<RefundRequest> existing = refundRequestRepository.findByTransactionId(paymentId);
            for (RefundRequest r : existing) if (!"REJECTED".equals(r.getStatus())) return CancelBookingResponse.alreadyRequested(type, id, title, start, r.getRefundAmount(), r.getRefundId(), paymentId, payment.getPaymentMethod(), r.getStatus());
            User member = userRepository.findById(user).orElseThrow();
            RefundRequest r = RefundRequest.builder().memberId(user).memberName(member.getFullName()).phone(member.getPhone())
                .transactionId(paymentId).referenceCode(payment.getReferenceCode()).bookingId(id).bookingType(type).bookingDescription(title)
                .refundAmount(payment.getAmount()).reason("Hủy đúng hạn hoặc buổi bị hủy").status("PENDING_APPROVAL").createdAt(LocalDateTime.now()).build();
            r = refundRequestRepository.save(r);
            if (engagementService != null) engagementService.audit(user, "MEMBER", "REFUND_REQUEST_CREATED", "paymentId=" + paymentId);
            return CancelBookingResponse.pendingApproval(type, id, title, start, r.getRefundAmount(), r.getRefundId(), paymentId, payment.getPaymentMethod());
        }
        if (payment != null && "PENDING".equals(payment.getPaymentStatus())) {
            payment.setPaymentStatus("FAILED"); paymentTransactionRepository.save(payment);
            if (voucherService != null) voucherService.release(payment);
        }
        return CancelBookingResponse.builder().bookingType(type).bookingId(id).bookingTitle(title).startTime(start).status("CANCELLED")
            .refunded(false).refundAmount(BigDecimal.ZERO).message("Đã hủy lịch.").build();
    }

    private void releasePtSession(Booking booking, ClassSession session) {
        if (booking.getPaymentId() != null && paymentTransactionRepository.findById(booking.getPaymentId()).map(p -> "PT".equals(p.getBookingType())).orElse(false)) {
            session.setStatus("CANCELLED");
        }
    }

    public boolean isRefundEligible(PaymentTransaction payment) {
        if (payment.getMembershipId() != null) {
            return userMembershipRepository.findById(payment.getMembershipId()).map(m ->
                List.of("PENDING_APPROVAL", "REJECTED").contains(m.getStatus())
                || ("ACTIVE".equals(m.getStatus()) && m.getUsedQuotaSessions() == 0 && m.getHeldQuotaSessions() == 0 && m.getUsedQuotaCourts() == 0 && m.getHeldQuotaCourts() == 0)).orElse(false);
        }
        if ("COURT".equals(payment.getBookingType())) {
            CourtBooking booking = courtBookingRepository.findByPaymentId(payment.getPaymentId());
            return booking != null && !"CHECKED_IN".equals(booking.getStatus()) && (!booking.getStartTime().minusHours(2).isBefore(LocalDateTime.now())
                || courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(booking.getCourtId(), booking.getEndTime(), booking.getStartTime()));
        }
        Booking booking = bookingRepository.findByPaymentId(payment.getPaymentId());
        if (booking == null) return false;
        ClassSession session = classSessionRepository.findById(booking.getSessionId()).orElse(null);
        return session != null && ("CANCELLED".equals(session.getStatus()) || isSessionUnderMaintenance(session) || !session.getStartTime().minusHours(2).isBefore(LocalDateTime.now()))
            && (booking.getAttendanceStatus() == null || booking.getAttendanceStatus() == AttendanceStatus.PENDING);
    }

    private boolean isSessionUnderMaintenance(ClassSession session) {
        if (syncService == null || session.getFacilityId() == null) return false;
        return syncService.getCourtIdsForFacility(session.getFacilityId(), session.getSportId(), null).stream()
            .anyMatch(id -> courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(id, session.getEndTime(), session.getStartTime()));
    }

    @Transactional
    public void prepareRefund(PaymentTransaction payment) {
        if (payment.getMembershipId() != null) {
            UserMembership m = userMembershipRepository.findByIdForUpdate(payment.getMembershipId()).orElseThrow();
            if (!List.of("ACTIVE", "PENDING_APPROVAL", "REJECTED").contains(m.getStatus())
                    || (m.getUsedQuotaSessions() != null && m.getUsedQuotaSessions() > 0)
                    || (m.getHeldQuotaSessions() != null && m.getHeldQuotaSessions() > 0)
                    || (m.getUsedQuotaCourts() != null && m.getUsedQuotaCourts() > 0)
                    || (m.getHeldQuotaCourts() != null && m.getHeldQuotaCourts() > 0))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói đã sử dụng hoặc đang giữ quota; cần xử lý các lịch trước khi hoàn tiền.");
        } else if ("COURT".equals(payment.getBookingType())) {
            CourtBooking candidate = courtBookingRepository.findByPaymentId(payment.getPaymentId());
            if (candidate == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch thiếu lịch sân.");
            CourtBooking b = courtBookingRepository.findByIdForUpdate(candidate.getCourtBookingId()).orElseThrow();
            if (List.of("CHECKED_IN", "NO_SHOW").contains(b.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch sân đã sử dụng.");
        } else {
            Booking candidate = bookingRepository.findByPaymentId(payment.getPaymentId());
            if (candidate == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch thiếu lịch học.");
            Booking b = bookingRepository.findByIdForUpdate(candidate.getBookingId()).orElseThrow();
            if (b.getAttendanceStatus() != null && b.getAttendanceStatus() != AttendanceStatus.PENDING)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Buổi học đã điểm danh; cần đối soát trước khi hoàn tiền.");
        }
    }

    @Transactional
    public void cancelBookingAfterRefund(Long id, String type, Long refundId) {
        if ("COURT".equals(type)) {
            CourtBooking booking = courtBookingRepository.findByIdForUpdate(id).orElseThrow();
            if ("CANCELLED".equals(booking.getStatus())) return;
            if ("CHECKED_IN".equals(booking.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân đã check-in, cần đối soát.");
            booking.setStatus("CANCELLED"); courtBookingRepository.save(booking);
        } else {
            Booking booking = bookingRepository.findByIdForUpdate(id).orElseThrow();
            if ("CANCELLED".equals(booking.getStatus())) return;
            booking.setStatus("CANCELLED"); bookingRepository.save(booking);
            ClassSession session = classSessionRepository.findByIdForUpdate(booking.getSessionId()).orElseThrow();
            releasePtSession(booking, session);
            session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES)); classSessionRepository.save(session);
        }
    }

    /**
     * Cho phép đổi lịch đặt sân miễn phí khi bị trùng lịch bảo trì hoặc đổi lịch chủ động
     */
    @Transactional
    public Map<String, Object> rescheduleCourtBooking(
            Long courtBookingId,
            Long userId,
            Long newCourtId,
            LocalDateTime newStartTime,
            LocalDateTime newEndTime) {
        CourtBooking courtBooking = courtBookingRepository.findByIdForUpdate(courtBookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt sân."));

        if (!courtBooking.getMemberId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền đổi lịch đặt sân này.");
        }
        if (!"CONFIRMED".equalsIgnoreCase(courtBooking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ có thể đổi lịch cho đơn đặt sân đang hoạt động (CONFIRMED).");
        }

        LocalDateTime now = LocalDateTime.now();
        if (courtBooking.getStartTime().minusHours(2).isBefore(now)
                && !courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(courtBooking.getCourtId(), courtBooking.getEndTime(), courtBooking.getStartTime()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ đổi lịch trước giờ bắt đầu ít nhất 2 tiếng.");
        if (newStartTime == null || newEndTime == null || !Duration.between(newStartTime, newEndTime).equals(Duration.between(courtBooking.getStartTime(), courtBooking.getEndTime())))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đổi lịch chỉ áp dụng cùng thời lượng; hãy hủy và đặt mới nếu đổi số giờ.");

        if (newStartTime == null || !newStartTime.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian bắt đầu mới phải ở trong tương lai.");
        }
        if (newEndTime == null || !newEndTime.isAfter(newStartTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc mới phải sau thời gian bắt đầu.");
        }

        Long targetCourtId = newCourtId != null ? newCourtId : courtBooking.getCourtId();
        SportsCourt targetCourt = sportsCourtRepository.findByIdForUpdate(targetCourtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sân thể thao mục tiêu."));

        SportsCourt originalCourt = sportsCourtRepository.findById(courtBooking.getCourtId()).orElseThrow();
        if (!targetCourt.isActive() || targetCourt.getHourlyRate().compareTo(originalCourt.getHourlyRate()) != 0
                || !java.util.Objects.equals(targetCourt.getSportId(), originalCourt.getSportId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đổi lịch chỉ áp dụng sân cùng bộ môn và đơn giá; hãy hủy và đặt mới.");
        if (bookingRepository.existsOverlappingBookingForMember(userId, ALL_ACTIVE_STATUSES, newStartTime, newEndTime))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch học trong khung giờ mới.");
        // Validate court opens/closes
        validateCourtSlot(targetCourt, newStartTime, newEndTime);

        // Check maintenance schedule on target court
        if (courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                targetCourtId, newEndTime, newStartTime)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân mục tiêu đang trong lịch bảo trì tại khung giờ này.");
        }

        // Check confirmed overlap on target court (excluding current booking)
        boolean courtOverlap = courtBookingRepository.existsConfirmedOverlapExcluding(
                targetCourtId, courtBookingId, newStartTime, newEndTime);
        if (courtOverlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ tại sân này đã có người khác đặt.");
        }

        // Check member doesn't have other overlapping booking
        boolean memberOverlap = courtBookingRepository.findAll().stream().anyMatch(cb ->
                !cb.getCourtBookingId().equals(courtBookingId)
                && cb.getMemberId().equals(userId)
                && List.of("CONFIRMED", "CHECKED_IN").contains(cb.getStatus())
                && cb.getStartTime().isBefore(newEndTime)
                && cb.getEndTime().isAfter(newStartTime));
        if (memberOverlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch đặt sân khác trong khung giờ này.");
        }

        LocalDateTime oldStart = courtBooking.getStartTime();
        LocalDateTime oldEnd = courtBooking.getEndTime();
        Long oldCourtId = courtBooking.getCourtId();

        courtBooking.setCourtId(targetCourtId);
        courtBooking.setStartTime(newStartTime);
        courtBooking.setEndTime(newEndTime);
        CourtBooking saved = courtBookingRepository.save(courtBooking);

        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
        String notice = "Bạn đã đổi lịch đặt sân #" + courtBookingId + " thành công sang " + targetCourt.getCourtName()
                + " (" + newStartTime.format(dtf) + " - " + newEndTime.format(dtf) + ").";
        if (engagementService != null) {
            engagementService.notifyUser(userId, "Đổi lịch đặt sân thành công", notice, "BOOKING_RESCHEDULE");
        }
        if (auditLogService != null) {
            auditLogService.logSuccess("BOOKING_RESCHEDULE", "COURT", userId,
                    "courtBookingId=" + courtBookingId + ", old=[" + oldCourtId + ", " + oldStart + "], new=[" + targetCourtId + ", " + newStartTime + "]");
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("courtBookingId", saved.getCourtBookingId());
        resp.put("courtId", saved.getCourtId());
        resp.put("courtName", targetCourt.getCourtName());
        resp.put("startTime", saved.getStartTime());
        resp.put("endTime", saved.getEndTime());
        resp.put("message", notice);
        return resp;
    }

    /**
     * Checkout court booking using MEMBERSHIP COURT QUOTA (Migration 002)
     * Business Rules:
     * 1. Trừ quota đúng theo số giờ user đặt (exact hours)
     * 2. KHÔNG cho phép đặt quota + payment (phải full quota hoặc full payment)
     * 3. User PHẢI có membership với sufficient court quota
     */
    @Transactional
    private BookingConfirmationResponse checkoutCourtWithQuota(Long memberId, CheckoutRequest request) {
        // 1. Lock court to prevent concurrent modifications
        SportsCourt court = sportsCourtRepository.findByIdForUpdate(request.itemId())
                .orElseThrow(() -> notFound("Không tìm thấy sân thể thao."));
        
        if (!court.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                "Sân này đang trong lịch bảo trì, tạm thời không nhận đặt chỗ.");
        }
        
        // 2. Validate time slot and calculate hours
        long hours = validateCourtSlot(court, request.startTime(), request.endTime());
        double exactHours = hours; // Use exact hours for quota
        
        // 3. Check maintenance schedule
        if (courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                court.getCourtId(), request.endTime(), request.startTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Sân đang trong lịch bảo trì tại thời điểm này.");
        }
        
        // 4. Check existing overlapping bookings
        if (courtBookingRepository.existsConfirmedOverlap(
                court.getCourtId(), request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
        }
        
        // 5. Get and validate membership with court quota
        UserMembership membership = membershipService.getActiveMembershipWithCourtQuota(memberId, exactHours);
        if (membership == null || membership.getRemainingQuotaCourts() < exactHours) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                String.format("Số giờ sân trong gói hội viên của bạn không đủ (cần %.1f giờ, hiện còn %d giờ). " +
                    "Vui lòng thanh toán theo giá bán lẻ.", 
                    exactHours, 
                    membership != null ? membership.getRemainingQuotaCourts() : 0));
        }
        
        // 6. Hold court quota
        membershipService.holdCourtQuota(membership.getMembershipId(), exactHours);
        
        // 7. Create CourtBooking with quota flag
        CourtBooking booking = new CourtBooking();
        booking.setMemberId(memberId);
        booking.setCourtId(court.getCourtId());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setStatus("CONFIRMED");
        booking.setAmountPaid(BigDecimal.ZERO); // No payment for quota booking
        booking.setPaymentId(null); // No payment needed
        booking.setUsesMembershipQuota(true);
        booking.setQuotaState("HELD");
        booking.setMembershipId(membership.getMembershipId());
        booking.setQuotaHoursUsed(BigDecimal.valueOf(exactHours));
        booking.setCreatedAt(LocalDateTime.now());
        
        CourtBooking savedBooking = courtBookingRepository.save(booking);
        
        // 8. Log audit
        if (auditLogService != null) {
            auditLogService.logSuccess(
                "COURT_BOOKING_QUOTA",
                "CourtBooking#" + savedBooking.getCourtBookingId(),
                memberId,
                String.format("Booked court %s (%.1f hours) using membership court quota. Membership #%d held %.1f hours.",
                    court.getCourtName(), exactHours, membership.getMembershipId(), exactHours)
            );
        }
        
        // 9. Refresh membership to get updated quota
        UserMembership updatedMembership = userMembershipRepository.findById(membership.getMembershipId())
                .orElseThrow();
        
        // 10. Get sport info
        PublicSport sport = getActiveSport(court.getSportId());
        
        // 11. Return confirmation
        String quotaMessage = String.format(
            "Đã dùng %.1f giờ court quota cho sân %s. Còn %d giờ.",
            exactHours, court.getCourtName(), 
            updatedMembership.getRemainingQuotaCourts());
            
        return new BookingConfirmationResponse(
                "COURT",
                savedBooking.getCourtBookingId(),
                null, // No payment
                court.getCourtName(),
                sport.getName(),
                court.getDescription(),
                savedBooking.getStartTime(),
                savedBooking.getEndTime(),
                BigDecimal.ZERO,
                null, // No payment status
                null, // No reference code
                true, // usedQuota
                (int) Math.ceil(exactHours), // quotaUsed
                updatedMembership.getRemainingQuotaCourts(), // quotaRemaining
                quotaMessage
        );
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
