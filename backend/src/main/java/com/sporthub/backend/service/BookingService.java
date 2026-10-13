package com.sporthub.backend.service;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.dto.ClassSessionResponse;
import com.sporthub.backend.dto.RosterBookingResponse;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    public BookingService(
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userRepository = userRepository;
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
                .collect(Collectors.toMap(Booking::getSessionId, Function.identity()));
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
                    booking == null ? null : booking.getStatus());
        }).toList();
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
    public Booking createBooking(Long memberId, Long sessionId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> notFound("Không tìm thấy tài khoản hội viên."));
        if (!"MEMBER".equalsIgnoreCase(member.getRole()) || !"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ hội viên đang hoạt động mới được đặt lớp.");
        }

        ClassSession session = classSessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> notFound("Không tìm thấy lớp học."));
        if (!"SCHEDULED".equalsIgnoreCase(session.getStatus())
                || session.getStartTime() == null
                || !session.getStartTime().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học không còn mở đăng ký.");
        }
        if (bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(memberId, sessionId, ALL_ACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đặt chỗ hoặc đang trong hàng đợi lớp này.");
        }

        int capacity = session.getMaxSlots() == null ? 0 : session.getMaxSlots();
        if (capacity < 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp học chưa được cấu hình sức chứa.");
        }
        long booked = bookingRepository.countBySessionIdAndStatusIn(sessionId, ACTIVE_STATUSES);
        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(sessionId)
                .bookingTime(LocalDateTime.now())
                .status(booked >= capacity ? "WAITLIST" : "BOOKED")
                .attendanceStatus("PENDING")
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        long actualBooked = bookingRepository.countBySessionIdAndStatusIn(sessionId, ACTIVE_STATUSES);
        session.setBookedSlots((int) Math.min(actualBooked, capacity));
        classSessionRepository.save(session);
        return savedBooking;
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, Long actorId) {
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
