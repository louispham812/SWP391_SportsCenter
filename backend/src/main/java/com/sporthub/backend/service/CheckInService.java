package com.sporthub.backend.service;

import com.sporthub.backend.dto.CheckInRequest;
import com.sporthub.backend.dto.CheckInResponse;
import com.sporthub.backend.entity.MemberCheckIn;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.entity.CourtBooking;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CheckInService {

    private final MemberCheckInRepository checkInRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final CourtBookingRepository courtBookingRepository;
    private final MembershipService membershipService;
    @org.springframework.beans.factory.annotation.Autowired private CheckInEligibilityService eligibility;

    public CheckInService(MemberCheckInRepository checkInRepository,
                          UserRepository userRepository, BookingRepository bookingRepository,
                          CourtBookingRepository courtBookingRepository, MembershipService membershipService) {
        this.checkInRepository = checkInRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.membershipService = membershipService;
    }

    @Transactional
    public CheckInResponse processCheckIn(CheckInRequest request) {
        
        User member = userRepository.findById(Long.valueOf(request.getMemberId()))
                .orElseThrow(() -> new RuntimeException("Hội viên không tồn tại!"));

        checkInBooking(member.getUserId(), request.getBookingId());

        String result = "VALID";
        String message = "Check-in thành công! Thẻ hợp lệ.";

        MemberCheckIn checkIn = MemberCheckIn.builder()
                .memberId(request.getMemberId() != null ? Long.valueOf(request.getMemberId()) : null)
                .checkedInAt(LocalDateTime.now())
                .result(result)
                .recordedBy(request.getReceptionistId() != null ? Long.valueOf(request.getReceptionistId()) : 0L)
                .build();

        MemberCheckIn saved = checkInRepository.save(checkIn);

        return CheckInResponse.builder()
                .checkInId(saved.getCheckInId())
                .memberId(member.getUserId()) 
                .memberName(member.getFullName())
                .status(result)
                .message(message)
                .checkedInAt(saved.getCheckedInAt())
                .build();
    }

    /** Shared by both reception endpoints; booking and quota updates commit with the check-in record. */
    @Transactional
    public void checkInBooking(Long memberId) { checkInBooking(memberId, null); }

    @Transactional
    public void checkInBooking(Long memberId, Long bookingId) {
        User member = userRepository.findByIdForUpdate(memberId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"ACTIVE".equals(member.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Tài khoản không hoạt động.");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dayStart = now.toLocalDate().atStartOfDay();
        // Lock eligible court bookings before checking for duplicate scans.
        List<CourtBooking> courts = courtBookingRepository.findCheckInEligibleBookings(
                memberId, dayStart, dayStart.plusDays(1), now);
        if (bookingId != null) courts = courts.stream().filter(b -> bookingId.equals(b.getCourtBookingId())).toList();
        if (bookingId != null && courts.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Đặt sân không hợp lệ, chưa đến giờ hoặc đã check-in.");
        if (bookingId == null && courts.size() > 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Có nhiều sân; vui lòng chọn sân cần check-in.");
        if (bookingId == null && checkInRepository.existsByMemberIdAndCheckedInAtAfter(memberId, now.minusMinutes(5))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Hội viên vừa mới check-in trong vòng 5 phút qua. Không cần quét lại.");
        }
        if (eligibility == null) throw new IllegalStateException("Dịch vụ kiểm tra check-in chưa sẵn sàng.");
        if (courts.isEmpty()) {
            var classes = bookingRepository.findCheckInEligibleClasses(memberId, now);
            if (classes.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Không có lịch đã xác nhận trong khung giờ hiện tại.");
            // Admission does not replace the coach's attendance or consume class/PT quota.
            for (var booking : classes) eligibility.validateClass(booking, memberId, now);
        } else {
            CourtBooking booking = eligibility.validateCourt(courts.getFirst(), memberId, now);
            if (Boolean.TRUE.equals(booking.getUsesMembershipQuota())) {
                membershipService.consumeCourtQuota(booking.getMembershipId(), booking.getQuotaHoursUsed().doubleValue());
                booking.setQuotaState("USED");
            }
            booking.setStatus("CHECKED_IN"); courtBookingRepository.save(booking);
        }
    }
}
