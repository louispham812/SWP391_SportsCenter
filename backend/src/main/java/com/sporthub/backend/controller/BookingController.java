package com.sporthub.backend.controller;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingRepository bookingRepository;

    private final ClassSessionRepository classSessionRepository;

    BookingController(BookingRepository bookingRepository, ClassSessionRepository classSessionRepository) {
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
    }

    // API 1: Xem tất cả lớp học sắp diễn ra
    @GetMapping("/classes")
    public ResponseEntity<List<ClassSession>> getAllClasses() {
        return ResponseEntity.ok(classSessionRepository.findAll());
    }

    // API 2: Member Đăng ký vào lớp học
    @PostMapping
    public ResponseEntity<?> bookClass(@RequestParam Long memberId, @RequestParam Long sessionId) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));

        if (session.getBookedSlots() >= session.getMaxSlots()) {
            return ResponseEntity.badRequest().body("Lớp học đã đủ chỗ!");
        }

        // Tăng số lượt đăng ký
        session.setBookedSlots(session.getBookedSlots() + 1);
        classSessionRepository.save(session);

        // Tạo booking mới
        Booking booking = Booking.builder()
                .memberId(memberId)
                .sessionId(sessionId)
                .bookingTime(LocalDateTime.now())
                .status("BOOKED")
                .attendanceStatus("PENDING")
                .build();

        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    // API 3: Xem lịch cá nhân của Member
    @GetMapping("/my-schedule")
    public ResponseEntity<List<Booking>> getMySchedule(@RequestParam Long memberId) {
        return ResponseEntity.ok(bookingRepository.findByMemberId(memberId));
    }

    // API 4: Điểm danh (Cho Coach / Receptionist)
    @PutMapping("/{bookingId}/attendance")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long bookingId,
            @RequestParam String status,
            @RequestParam(required = false) String coachNote) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đặt chỗ!"));

        booking.setAttendanceStatus(status); // PRESENT hoặc ABSENT
        if (coachNote != null) {
            booking.setCoachNote(coachNote);
        }

        return ResponseEntity.ok(bookingRepository.save(booking));
    }
}