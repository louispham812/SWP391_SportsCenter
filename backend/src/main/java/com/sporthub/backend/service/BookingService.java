package com.sporthub.backend.service;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public List<Booking> getBookingsByMember(Long memberId) {
        return bookingRepository.findByMemberId(memberId);
    }

    public Booking createBooking(Booking booking) {
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("BOOKED");
        booking.setAttendanceStatus("PENDING");
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt đặt lịch"));
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }
}