package com.sporthub.backend.service;

import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.BookingQuoteResponse;
import com.sporthub.backend.dto.CoachScheduleEntryResponse;
import com.sporthub.backend.dto.CoachStudentBookingResponse;
import com.sporthub.backend.dto.CoachPublicProfileResponse;
import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.dto.ClassSessionResponse;
import com.sporthub.backend.dto.CourtSlotResponse;
import com.sporthub.backend.dto.MemberScheduleEntryResponse;
import com.sporthub.backend.dto.RosterBookingResponse;
import com.sporthub.backend.dto.ReceptionistClassResponse;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import java.math.RoundingMode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
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

@Service
public class BookingService {

    private static final List<String> ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED");
    private static final List<String> WAITLIST_STATUSES = List.of("WAITLIST");
    private static final List<String> ALL_ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED", "WAITLIST");

    private final BookingRepository bookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final UserRepository userRepository;
    private final PublicSportRepository publicSportRepository;
    private final PublicFacilityRepository publicFacilityRepository;
    private final SportsCourtRepository sportsCourtRepository;
    private final CourtBookingRepository courtBookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final MembershipPackageRepository membershipPackageRepository;

    // Tùy chọn (setter/field injection) để giữ nguyên constructor cho unit test.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.sporthub.backend.repository.CourtMaintenanceRepository courtMaintenanceRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private EngagementService engagementService;

    private boolean isUnderMaintenance(Long courtId, LocalDateTime start, LocalDateTime end) {
        return courtMaintenanceRepository != null
                && !courtMaintenanceRepository
                        .findByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(courtId, end, start).isEmpty();
    }

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository) {
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userRepository = userRepository;
        this.publicSportRepository = publicSportRepository;
        this.publicFacilityRepository = publicFacilityRepository;
        this.sportsCourtRepository = sportsCourtRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.membershipPackageRepository = membershipPackageRepository;
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
        Map<Long, String> coachNames = userRepository.findAllById(
                        sessions.stream().map(ClassSession::getCoachId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getUserId, User::getFullName));
        List<Long> sessionIds = sessions.stream().map(ClassSession::getSessionId).toList();
        Map<Long, Long> bookedCounts = sessionIds.isEmpty()
                ? Map.of()
                : bookingRepository.findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES).stream()
                        .collect(Collectors.groupingBy(Booking::getSessionId, Collectors.counting()));

        return sessions.stream().map(session -> {
            Booking booking = bookingsBySession.get(session.getSessionId());
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
                    session.getStatus(),
                    booking == null ? null : booking.getBookingId(),
                    booking == null ? null : booking.getStatus(),
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
                            booking.getAttendanceStatus());
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
        return sportsCourtRepository.findBySportIdAndActiveTrueOrderByCourtIdAsc(sportId).stream()
                .flatMap(court -> {
                    LocalDateTime from = today.atStartOfDay();
                    List<CourtBooking> existingBookings = courtBookingRepository
                            .findByCourtIdAndStatusAndStartTimeBetween(court.getCourtId(), "CONFIRMED", from, horizon);
                    return java.util.stream.Stream.iterate(today, date -> date.plusDays(1))
                            .limit(14)
                            .flatMap(date -> slotsForDay(court, sport, date, existingBookings).stream());
                })
                .toList();
    }

    private List<CourtSlotResponse> slotsForDay(
            SportsCourt court,
            PublicSport sport,
            LocalDate date,
            List<CourtBooking> existingBookings) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime slot = date.atTime(court.getOpensAt());
        LocalDateTime close = date.atTime(court.getClosesAt());
        List<CourtSlotResponse> slots = new java.util.ArrayList<>();
        while (!slot.plusHours(1).isAfter(close)) {
            LocalDateTime end = slot.plusHours(1);
            LocalDateTime candidate = slot;
            boolean occupied = existingBookings.stream().anyMatch(booking ->
                    booking.getStartTime().isBefore(end) && booking.getEndTime().isAfter(candidate))
                    || isUnderMaintenance(court.getCourtId(), candidate, end);
            if (slot.isAfter(now) && !occupied) {
                slots.add(new CourtSlotResponse(
                        court.getCourtId(),
                        court.getCourtName(),
                        court.getDescription(),
                        sport.getName(),
                        court.getHourlyRate(),
                        slot,
                        end));
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
        if (memberId == null || originalAmount == null || originalAmount.signum() <= 0) {
            return new DiscountInfo(originalAmount, originalAmount, BigDecimal.ZERO, null);
        }
        List<UserMembership> activeMemberships = userMembershipRepository.findByUserIdOrderByEndDateDesc(memberId).stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) && (m.getEndDate() == null || !m.getEndDate().isBefore(LocalDate.now())))
                .toList();
        if (activeMemberships.isEmpty()) {
            return new DiscountInfo(originalAmount, originalAmount, BigDecimal.ZERO, null);
        }
        UserMembership active = activeMemberships.get(0);
        MembershipPackage pkg = membershipPackageRepository.findById(active.getPackageId()).orElse(null);
        String pkgName = pkg == null ? "Gói Hội Viên" : pkg.getName();
        String upperPkg = pkgName.toUpperCase(Locale.ROOT);

        int percent;
        if (upperPkg.contains("DIAMOND") || upperPkg.contains("VIP")) {
            percent = "COURT".equalsIgnoreCase(bookingType) ? 50 : 30;
        } else if (upperPkg.contains("GOLD") || upperPkg.contains("VÀNG")) {
            percent = "COURT".equalsIgnoreCase(bookingType) ? 30 : 20;
        } else {
            percent = "COURT".equalsIgnoreCase(bookingType) ? 15 : 10;
        }

        BigDecimal discountAmount = originalAmount.multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal finalAmount = originalAmount.subtract(discountAmount);
        String label = "Ưu đãi " + pkgName + " (-" + percent + "%)";
        return new DiscountInfo(finalAmount, originalAmount, discountAmount, label);
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
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> notFound("Không tìm thấy tài khoản hội viên."));
        if (!"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản của bạn chưa được kích hoạt hoặc đang bị khóa.");
        }
        if ("COACH".equalsIgnoreCase(member.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản Huấn luyện viên không thể đặt chỗ như hội viên.");
        }

        String bookingType = normalizeBookingType(request.bookingType());
        if ("COURT".equals(bookingType)) {
            return checkoutCourt(memberId, request);
        }
        if ("PT".equals(bookingType)) {
            return checkoutPt(memberId, request);
        }
        return checkoutClass(memberId, request);
    }

    private BookingConfirmationResponse checkoutPt(Long memberId, CheckoutRequest request) {
        User coach = userRepository.findById(request.itemId())
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
        PaymentTransaction payment = createPaymentTransaction(memberId, "PT", discount.finalAmount(), request.paymentMethod());

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
        session.setPriceAmount(discount.finalAmount());
        session.setStatus("SCHEDULED");
        ClassSession savedSession = classSessionRepository.save(session);

        Booking booking = new Booking();
        booking.setMemberId(memberId);
        booking.setSessionId(savedSession.getSessionId());
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        booking.setAttendanceStatus("PENDING");
        booking.setFeeAmount(discount.finalAmount());
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
                discount.finalAmount(),
                payment.getPaymentStatus(),
                payment.getReferenceCode());
    }

    private BookingConfirmationResponse checkoutCourt(Long memberId, CheckoutRequest request) {
        SportsCourt court = sportsCourtRepository.findByIdForUpdate(request.itemId())
                .filter(SportsCourt::isActive)
                .orElseThrow(() -> notFound("Không tìm thấy sân đang hoạt động."));
        long hours = validateCourtSlot(court, request.startTime(), request.endTime());
        if (isUnderMaintenance(court.getCourtId(), request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sân đang trong lịch bảo trì, vui lòng chọn sân hoặc khung giờ khác.");
        }
        if (courtBookingRepository.existsConfirmedOverlap(court.getCourtId(), request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Một hoặc nhiều khung giờ sân đã chọn vừa được người khác đặt.");
        }
        if (bookingRepository.existsOverlappingBookingForMember(memberId, ALL_ACTIVE_STATUSES, request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có lịch tham gia lớp học trong khung giờ này.");
        }
        if (courtBookingRepository.existsConfirmedOverlapForMember(memberId, request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã có một lịch đặt sân khác trong khung giờ này.");
        }
        PublicSport sport = getActiveSport(court.getSportId());
        BigDecimal baseAmount = court.getHourlyRate().multiply(BigDecimal.valueOf(hours));
        DiscountInfo discount = calculateDiscount(memberId, "COURT", baseAmount);
        PaymentTransaction payment = createPaymentTransaction(memberId, "COURT", discount.finalAmount(), request.paymentMethod());

        CourtBooking booking = new CourtBooking();
        booking.setMemberId(memberId);
        booking.setCourtId(court.getCourtId());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setAmountPaid(discount.finalAmount());
        booking.setPaymentId(payment.getPaymentId());
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(LocalDateTime.now());
        CourtBooking saved = courtBookingRepository.save(booking);
        return new BookingConfirmationResponse(
                "COURT", saved.getCourtBookingId(), payment.getPaymentId(),
                court.getCourtName(), sport.getName(), court.getDescription(),
                saved.getStartTime(), saved.getEndTime(), saved.getAmountPaid(),
                payment.getPaymentStatus(), payment.getReferenceCode());
    }

    private BookingConfirmationResponse checkoutClass(Long memberId, CheckoutRequest request) {
        ClassSession session = classSessionRepository.findByIdForUpdate(request.itemId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        validateBookableClass(session);
        if (bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(memberId, session.getSessionId(), ALL_ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt chỗ hoặc đang trong hàng đợi lớp này.");
        }
        if (bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES) >= session.getMaxSlots()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học vừa hết chỗ.");
        }
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
        User coach = userRepository.findById(session.getCoachId())
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên của lớp."));
        PaymentTransaction payment = createPaymentTransaction(memberId, "CLASS", discount.finalAmount(), request.paymentMethod());

        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(session.getSessionId())
                .bookingTime(LocalDateTime.now())
                .status("BOOKED")
                .attendanceStatus("PENDING")
                .feeAmount(discount.finalAmount())
                .paymentId(payment.getPaymentId())
                .build();
        Booking saved = bookingRepository.save(booking);
        session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES));
        classSessionRepository.save(session);
        if (engagementService != null) {
            engagementService.notifyUser(session.getCoachId(), "Học viên mới đăng ký lớp",
                    "Có học viên vừa đăng ký lớp \"" + session.getClassName() + "\" (" + session.getStartTime() + ").", "SCHEDULE");
            engagementService.notifyUser(memberId, "Đăng ký lớp thành công",
                    "Bạn đã đăng ký lớp \"" + session.getClassName() + "\" lúc " + session.getStartTime() + ".", "BOOKING");
        }
        return new BookingConfirmationResponse(
                "CLASS", saved.getBookingId(), payment.getPaymentId(),
                session.getClassName(), sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(), session.getEndTime(), discount.finalAmount(),
                payment.getPaymentStatus(), payment.getReferenceCode());
    }

    private PaymentTransaction createPaymentTransaction(Long memberId, String bookingType, BigDecimal amount, String paymentMethod) {
        String method = (paymentMethod == null || paymentMethod.isBlank()) ? "SANDBOX" : paymentMethod.toUpperCase(Locale.ROOT);
        String prefix = switch (method) {
            case "VIETQR", "QR" -> "VQR";
            case "VNPAY" -> "VNP";
            case "MOMO" -> "MOM";
            case "CASH_COUNTER", "CASH" -> "CSH";
            default -> "SBX";
        };
        PaymentTransaction payment = new PaymentTransaction();
        payment.setMemberId(memberId);
        payment.setBookingType(bookingType);
        payment.setAmount(amount);
        payment.setPaymentMethod(method);
        payment.setPaymentStatus("PAID");
        payment.setReferenceCode(prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT));
        payment.setCreatedAt(LocalDateTime.now());
        return paymentTransactionRepository.save(payment);
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

        List<MemberScheduleEntryResponse> entries = classBookings.stream()
                .filter(booking -> classes.containsKey(booking.getSessionId()))
                .map(booking -> {
                    ClassSession session = classes.get(booking.getSessionId());
                    PublicSport sport = publicSportRepository.findById(session.getSportId()).orElse(null);
                    PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId()).orElse(null);
                    User coach = coaches.get(session.getCoachId());
                    boolean isCancelled = "CANCELLED".equalsIgnoreCase(booking.getStatus());
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
                            booking.getAttendanceStatus(),
                            booking.getCoachNote(),
                            isCancelled ? "REFUNDED" : null);
                }).collect(Collectors.toCollection(java.util.ArrayList::new));

        List<CourtBooking> courtBookings = courtBookingRepository.findByMemberIdOrderByStartTimeAsc(memberId);
        Map<Long, SportsCourt> courts = sportsCourtRepository.findAllById(
                        courtBookings.stream().map(CourtBooking::getCourtId).distinct().toList()).stream()
                .collect(Collectors.toMap(SportsCourt::getCourtId, Function.identity()));
        for (CourtBooking booking : courtBookings) {
            SportsCourt court = courts.get(booking.getCourtId());
            if (court == null) continue;
            PublicSport sport = publicSportRepository.findById(court.getSportId()).orElse(null);
            boolean isCancelled = "CANCELLED".equalsIgnoreCase(booking.getStatus());
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
                    isCancelled ? "REFUNDED" : null));
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
        return sportsCourtRepository.findById(courtId)
                .filter(SportsCourt::isActive)
                .orElseThrow(() -> notFound("Không tìm thấy sân đang hoạt động."));
    }

    @Transactional(readOnly = true)
    public List<Booking> getMemberSchedule(Long memberId) {
        return bookingRepository.findByMemberIdAndStatusIn(memberId, ALL_ACTIVE_STATUSES);
    }

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
                    booking.getAttendanceStatus(),
                    booking.getCoachNote());
        }).toList();
    }

    @Transactional
    public Booking cancelClassBooking(Long bookingId, Long actorId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> notFound("Không tìm thấy thông tin đặt chỗ."));
        if (!booking.getMemberId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được hủy đặt chỗ của chính mình.");
        }

        ClassSession session = classSessionRepository.findByIdForUpdate(booking.getSessionId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học liên quan."));
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đặt chỗ này đã được hủy.");
        }
        if (!ACTIVE_STATUSES.contains(booking.getStatus().toUpperCase(Locale.ROOT))
                && !WAITLIST_STATUSES.contains(booking.getStatus().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái đặt chỗ không thể hủy.");
        }

        boolean wasBooked = ACTIVE_STATUSES.contains(booking.getStatus().toUpperCase(Locale.ROOT));
        if (wasBooked && (session.getStartTime() == null
                || session.getStartTime().minusHours(2).isBefore(LocalDateTime.now()))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chỉ có thể hủy lớp trước giờ bắt đầu ít nhất 2 tiếng.");
        }
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        // Only update original payment transaction status to REFUNDED. Do not insert duplicate refund rows.
        if (booking.getPaymentId() != null) {
            paymentTransactionRepository.findById(booking.getPaymentId()).ifPresent(orig -> {
                orig.setPaymentStatus("REFUNDED");
                paymentTransactionRepository.save(orig);
            });
        }

        if (wasBooked) {
            Booking nextInLine = bookingRepository
                    .findBySessionIdAndStatusInOrderByBookingTimeAsc(booking.getSessionId(), WAITLIST_STATUSES)
                    .stream()
                    .findFirst()
                    .orElse(null);
            if (nextInLine != null) {
                nextInLine.setStatus("BOOKED");
                bookingRepository.save(nextInLine);
            }
        }
        long remainingBooked = bookingRepository.countBySessionIdAndStatusIn(booking.getSessionId(), ACTIVE_STATUSES);
        session.setBookedSlots((int) remainingBooked);
        classSessionRepository.save(session);
        return booking;
    }

    @Transactional
    public CourtBooking cancelCourtBooking(Long bookingId, Long actorId) {
        CourtBooking booking = courtBookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> notFound("Không tìm thấy thông tin đặt sân."));
        if (!booking.getMemberId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được hủy đặt sân của chính mình.");
        }
        if (!"CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái đặt sân không thể hủy.");
        }
        if (booking.getStartTime() == null
                || booking.getStartTime().minusHours(2).isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Chỉ có thể hủy đặt sân trước giờ bắt đầu ít nhất 2 tiếng.");
        }

        booking.setStatus("CANCELLED");
        CourtBooking saved = courtBookingRepository.save(booking);

        // Only update original payment transaction status to REFUNDED. Do not insert duplicate refund rows.
        if (booking.getPaymentId() != null) {
            paymentTransactionRepository.findById(booking.getPaymentId()).ifPresent(orig -> {
                orig.setPaymentStatus("REFUNDED");
                paymentTransactionRepository.save(orig);
            });
        }
        return saved;
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
        // Lễ tân gửi EXCUSED_ABSENCE / UNEXCUSED_ABSENCE: lưu thành ABSENT và ghi rõ loại vắng vào ghi chú.
        String absenceTag = null;
        if ("EXCUSED_ABSENCE".equals(normalizedStatus)) {
            normalizedStatus = "ABSENT";
            absenceTag = "[Vắng có phép]";
        } else if ("UNEXCUSED_ABSENCE".equals(normalizedStatus)) {
            normalizedStatus = "ABSENT";
            absenceTag = "[Vắng không phép]";
        }
        if (!List.of("PRESENT", "ABSENT").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Trạng thái điểm danh phải là PRESENT, ABSENT, EXCUSED_ABSENCE hoặc UNEXCUSED_ABSENCE.");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> notFound("Không tìm thấy thông tin đặt chỗ."));
        ClassSession session = classSessionRepository.findById(booking.getSessionId())
                .orElseThrow(() -> notFound("Không tìm thấy lớp học liên quan."));
        if ("COACH".equals(actorRole) && !session.getCoachId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công lớp học này.");
        }
        if (!ACTIVE_STATUSES.contains(booking.getStatus().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ đặt chỗ đã xác nhận mới được điểm danh.");
        }

        booking.setAttendanceStatus(normalizedStatus);
        if (coachNote != null || absenceTag != null) {
            String note = coachNote == null ? "" : coachNote.trim().replaceFirst("^\\[Vắng (có|không) phép\\]\\s*", "");
            booking.setCoachNote(absenceTag == null ? note : (absenceTag + " " + note).trim());
        }
        Booking updatedBooking = bookingRepository.save(booking);
        if (engagementService != null) {
            engagementService.audit(actorId, actorRole, "ATTENDANCE_UPDATED",
                    "booking=" + bookingId + ", status=" + normalizedStatus + (absenceTag == null ? "" : " " + absenceTag));
            engagementService.notifyUser(booking.getMemberId(), "Cập nhật điểm danh",
                    "Buổi học \"" + session.getClassName() + "\": " + ("PRESENT".equals(normalizedStatus) ? "có mặt" : "vắng mặt")
                            + (absenceTag == null ? "" : " " + absenceTag) + ".", "ATTENDANCE");
        }
        return updatedBooking;
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
