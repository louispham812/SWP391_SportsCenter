package com.sporthub.backend.service;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ClassSessionRepository classSessionRepository;

    // Lấy tất cả lịch đặt
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // Lấy lịch đặt theo ID
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đặt lịch với ID: " + id));
    }

    // 1. Tạo đặt lịch mới (Có kiểm tra trùng lịch & sức chứa)
    @Transactional
    public Booking createBooking(Long memberId, Long sessionId) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học/sân với ID: " + sessionId));

        // Kiểm tra xem session đã đầy chưa (Giả sử MaxSlots là sức chứa tối đa)
        List<Booking> currentBookings = bookingRepository.findBySessionId(sessionId);
        if (session.getMaxSlots() != null && currentBookings.size() >= session.getMaxSlots()) {
            throw new RuntimeException("Buổi học/sân này đã kín chỗ (Full), không thể đặt thêm!");
        }

        // Kiểm tra xem member đã đặt buổi này trước đó chưa (Tránh đặt trùng)
        boolean alreadyBooked = currentBookings.stream()
                .anyMatch(b -> b.getMemberId().equals(memberId));
        if (alreadyBooked) {
            throw new RuntimeException("Thành viên đã đặt lịch cho buổi này rồi!");
        }

        Booking booking = new Booking();
        booking.setMemberId(memberId);
        booking.setSessionId(sessionId);
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("CONFIRMED");

        return bookingRepository.save(booking);
    }

    // 2. Hủy lịch (Chỉ cho phép hủy trước thời gian bắt đầu ít nhất 24 tiếng)
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = getBookingById(bookingId);
        
        ClassSession session = classSessionRepository.findById(booking.getSessionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin buổi học liên quan."));

        // Giả sử ClassSession có trường getStartTime() kiểu LocalDateTime
        if (session.getStartTime() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (now.plusHours(24).isAfter(session.getStartTime())) {
                throw new RuntimeException("Chỉ được phép hủy lịch trước thời gian diễn ra ít nhất 24 tiếng!");
            }
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }
}