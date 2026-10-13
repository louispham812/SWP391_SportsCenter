package com.sporthub.backend.service;

import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.BookingQuoteResponse;
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
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            PublicSportRepository publicSportRepository,
            PublicFacilityRepository publicFacilityRepository,
            SportsCourtRepository sportsCourtRepository,
            CourtBookingRepository courtBookingRepository,
            PaymentTransactionRepository paymentTransactionRepository) {
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userRepository = userRepository;
        this.publicSportRepository = publicSportRepository;
        this.publicFacilityRepository = publicFacilityRepository;
        this.sportsCourtRepository = sportsCourtRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
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
                    booking.getStartTime().isBefore(end) && booking.getEndTime().isAfter(candidate));
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

    @Transactional(readOnly = true)
    public BookingQuoteResponse getQuote(String bookingType, Long itemId, LocalDateTime startTime, LocalDateTime endTime) {
        String normalizedType = normalizeBookingType(bookingType);
        if ("COURT".equals(normalizedType)) {
            SportsCourt court = getActiveCourt(itemId);
            validateCourtSlot(court, startTime, endTime);
            if (courtBookingRepository.existsConfirmedOverlap(itemId, startTime, endTime)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ sân vừa được người khác đặt.");
            }
            PublicSport sport = getActiveSport(court.getSportId());
            return new BookingQuoteResponse(
                    normalizedType, itemId, court.getCourtName(), sport.getName(),
                    court.getDescription(), startTime, endTime, court.getHourlyRate());
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
        return new BookingQuoteResponse(
                normalizedType,
                itemId,
                session.getClassName(),
                sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(),
                session.getEndTime(),
                requirePrice(session.getPriceAmount()));
    }

    @Transactional
    public BookingConfirmationResponse checkout(Long memberId, CheckoutRequest request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> notFound("Không tìm thấy tài khoản hội viên."));
        if (!"MEMBER".equalsIgnoreCase(member.getRole()) || !"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ hội viên đang hoạt động mới được thanh toán booking.");
        }
        if (request.paymentMethod() != null && !"SANDBOX".equalsIgnoreCase(request.paymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hiện chỉ hỗ trợ phương thức thanh toán sandbox.");
        }

        String bookingType = normalizeBookingType(request.bookingType());
        if ("COURT".equals(bookingType)) {
            return checkoutCourt(memberId, request);
        }
        return checkoutClass(memberId, request.itemId());
    }

    private BookingConfirmationResponse checkoutCourt(Long memberId, CheckoutRequest request) {
        SportsCourt court = sportsCourtRepository.findByIdForUpdate(request.itemId())
                .filter(SportsCourt::isActive)
                .orElseThrow(() -> notFound("Không tìm thấy sân đang hoạt động."));
        validateCourtSlot(court, request.startTime(), request.endTime());
        if (courtBookingRepository.existsConfirmedOverlap(court.getCourtId(), request.startTime(), request.endTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ sân vừa được người khác đặt.");
        }
        PublicSport sport = getActiveSport(court.getSportId());
        PaymentTransaction payment = createSandboxPayment(memberId, "COURT", court.getHourlyRate());

        CourtBooking booking = new CourtBooking();
        booking.setMemberId(memberId);
        booking.setCourtId(court.getCourtId());
        booking.setStartTime(request.startTime());
        booking.setEndTime(request.endTime());
        booking.setAmountPaid(court.getHourlyRate());
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

    private BookingConfirmationResponse checkoutClass(Long memberId, Long sessionId) {
        ClassSession session = classSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        validateBookableClass(session);
        if (bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(memberId, sessionId, ALL_ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt chỗ hoặc đang trong hàng đợi lớp này.");
        }
        if (bookingRepository.countBySessionIdAndStatusIn(sessionId, ACTIVE_STATUSES) >= session.getMaxSlots()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học vừa hết chỗ.");
        }

        BigDecimal price = requirePrice(session.getPriceAmount());
        PublicSport sport = getActiveSport(session.getSportId());
        PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId())
                .orElseThrow(() -> notFound("Không tìm thấy địa điểm lớp học."));
        User coach = userRepository.findById(session.getCoachId())
                .orElseThrow(() -> notFound("Không tìm thấy huấn luyện viên của lớp."));
        PaymentTransaction payment = createSandboxPayment(memberId, "CLASS", price);

        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(session.getSessionId())
                .bookingTime(LocalDateTime.now())
                .status("BOOKED")
                .attendanceStatus("PENDING")
                .feeAmount(price)
                .paymentId(payment.getPaymentId())
                .build();
        Booking saved = bookingRepository.save(booking);
        session.setBookedSlots((int) bookingRepository.countBySessionIdAndStatusIn(sessionId, ACTIVE_STATUSES));
        classSessionRepository.save(session);
        return new BookingConfirmationResponse(
                "CLASS", saved.getBookingId(), payment.getPaymentId(),
                session.getClassName(), sport.getName(),
                facility.getName() + " · HLV " + coach.getFullName(),
                session.getStartTime(), session.getEndTime(), price,
                payment.getPaymentStatus(), payment.getReferenceCode());
    }

    private PaymentTransaction createSandboxPayment(Long memberId, String bookingType, BigDecimal amount) {
        PaymentTransaction payment = new PaymentTransaction();
        payment.setMemberId(memberId);
        payment.setBookingType(bookingType);
        payment.setAmount(amount);
        payment.setPaymentMethod("SANDBOX");
        payment.setPaymentStatus("PAID");
        payment.setReferenceCode("SBX-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT));
        payment.setCreatedAt(LocalDateTime.now());
        return paymentTransactionRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<MemberScheduleEntryResponse> getMemberScheduleEntries(Long memberId) {
        List<Booking> classBookings = bookingRepository.findByMemberIdAndStatusIn(memberId, ACTIVE_STATUSES);
        Map<Long, ClassSession> classes = classSessionRepository.findAllById(
                        classBookings.stream().map(Booking::getSessionId).distinct().toList()).stream()
                .collect(Collectors.toMap(ClassSession::getSessionId, Function.identity()));
        List<MemberScheduleEntryResponse> entries = classBookings.stream()
                .filter(booking -> classes.containsKey(booking.getSessionId()))
                .map(booking -> {
                    ClassSession session = classes.get(booking.getSessionId());
                    PublicSport sport = publicSportRepository.findById(session.getSportId()).orElse(null);
                    PublicFacility facility = publicFacilityRepository.findById(session.getFacilityId()).orElse(null);
                    return new MemberScheduleEntryResponse(
                            "CLASS", booking.getBookingId(), session.getClassName(),
                            sport == null ? "Bộ môn" : sport.getName(),
                            facility == null ? "Địa điểm" : facility.getName(),
                            session.getStartTime(), session.getEndTime(),
                            booking.getFeeAmount(), booking.getStatus());
                }).collect(Collectors.toCollection(java.util.ArrayList::new));

        List<CourtBooking> courtBookings = courtBookingRepository
                .findByMemberIdAndStatusOrderByStartTimeAsc(memberId, "CONFIRMED");
        Map<Long, SportsCourt> courts = sportsCourtRepository.findAllById(
                        courtBookings.stream().map(CourtBooking::getCourtId).distinct().toList()).stream()
                .collect(Collectors.toMap(SportsCourt::getCourtId, Function.identity()));
        for (CourtBooking booking : courtBookings) {
            SportsCourt court = courts.get(booking.getCourtId());
            if (court == null) continue;
            PublicSport sport = publicSportRepository.findById(court.getSportId()).orElse(null);
            entries.add(new MemberScheduleEntryResponse(
                    "COURT", booking.getCourtBookingId(), court.getCourtName(),
                    sport == null ? "Bộ môn" : sport.getName(),
                    court.getDescription(), booking.getStartTime(), booking.getEndTime(),
                    booking.getAmountPaid(), booking.getStatus()));
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

    private void validateCourtSlot(SportsCourt court, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null || !endTime.equals(startTime.plusHours(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi lượt đặt sân có thời lượng cố định 60 phút.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (!startTime.isAfter(now) || startTime.isAfter(now.plusDays(14))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể đặt sân trong 14 ngày tới.");
        }
        if (!startTime.toLocalTime().equals(startTime.toLocalTime().withMinute(0).withSecond(0).withNano(0))
                || endTime.toLocalTime().isAfter(court.getClosesAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ sân không hợp lệ.");
        }
        if (startTime.toLocalTime().isBefore(court.getOpensAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ nằm ngoài giờ hoạt động của sân.");
        }
    }

    private String normalizeBookingType(String bookingType) {
        String normalized = bookingType == null ? "" : bookingType.trim().toUpperCase(Locale.ROOT);
        if (!List.of("COURT", "CLASS").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại booking phải là COURT hoặc CLASS.");
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
        return courtBookingRepository.save(booking);
    }

    @Transactional
    public Booking updateAttendance(Long bookingId, Long actorId, String actorRole, String status, String coachNote) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PRESENT", "ABSENT").contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái điểm danh phải là PRESENT hoặc ABSENT.");
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
        if (coachNote != null) {
            booking.setCoachNote(coachNote.trim());
        }
        return bookingRepository.save(booking);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
