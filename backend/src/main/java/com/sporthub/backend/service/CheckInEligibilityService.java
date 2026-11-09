package com.sporthub.backend.service;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CheckInEligibilityService {
    private final SportsCourtRepository sportsCourts;
    private final CourtBookingRepository courts;
    private final CourtMaintenanceRepository maintenance;
    private final PaymentTransactionRepository payments;
    private final BookingRepository bookings;
    private final ClassSessionRepository sessions;
    private final PublicFacilityRepository facilities;
    private final FacilityCourtSyncService sync;
    private final MembershipService memberships;
    @PersistenceContext private EntityManager entityManager;
    public CheckInEligibilityService(SportsCourtRepository sportsCourts, CourtBookingRepository courts,
            CourtMaintenanceRepository maintenance, PaymentTransactionRepository payments, BookingRepository bookings,
            ClassSessionRepository sessions, PublicFacilityRepository facilities, FacilityCourtSyncService sync, MembershipService memberships) {
        this.sportsCourts = sportsCourts; this.courts = courts; this.maintenance = maintenance; this.payments = payments;
        this.bookings = bookings; this.sessions = sessions; this.facilities = facilities; this.sync = sync; this.memberships = memberships;
    }

    @Transactional
    public CourtBooking validateCourt(CourtBooking candidate, Long memberId, LocalDateTime now) {
        PaymentTransaction payment = lockPayment(candidate.getPaymentId());
        SportsCourt court = sportsCourts.findByIdForUpdate(candidate.getCourtId()).orElseThrow(() -> conflict("Không tìm thấy sân."));
        CourtBooking b = courts.findByIdForUpdate(candidate.getCourtBookingId()).orElseThrow(() -> conflict("Không tìm thấy booking."));
        refresh(court); refresh(b);
        if (!memberId.equals(b.getMemberId()) || !court.getCourtId().equals(b.getCourtId())
                || (payment != null && !payment.getPaymentId().equals(b.getPaymentId())) || !"CONFIRMED".equals(b.getStatus())) throw conflict("Booking sân đã thay đổi hoặc không thuộc hội viên.");
        requireTime(b.getStartTime(), b.getEndTime(), now);
        requireOpenCourt(court, b.getStartTime(), b.getEndTime());
        if (Boolean.TRUE.equals(b.getUsesMembershipQuota())) {
            if (b.getMembershipId() == null || (b.getQuotaState() != null && !"HELD".equals(b.getQuotaState()))) throw conflict("Quota của booking không còn ở trạng thái giữ.");
            memberships.requireCourtCheckIn(b.getMembershipId(), b.getQuotaHoursUsed() == null ? 0 : b.getQuotaHoursUsed().doubleValue());
            requireMembershipOwner(b.getMembershipId(), memberId);
        } else requirePaid(payment, b.getPaymentId(), memberId, b.getAmountPaid(), Set.of("COURT"));
        return b;
    }

    @Transactional
    public Booking validateClass(Booking candidate, Long memberId, LocalDateTime now) {
        PaymentTransaction payment = lockPayment(candidate.getPaymentId());
        ClassSession session = sessions.findByIdForUpdate(candidate.getSessionId()).orElseThrow(() -> conflict("Không tìm thấy buổi học."));
        refresh(session);
        if (session.getStatus() == null || !Set.of("SCHEDULED", "IN_PROGRESS").contains(session.getStatus())) throw conflict("Buổi học đang đóng.");
        requireTime(session.getStartTime(), session.getEndTime(), now);
        List<Long> courtIds = new ArrayList<>(sync.getCourtIdsForFacility(session.getFacilityId(), session.getSportId(), null));
        courtIds.sort(Long::compareTo);
        for (Long id : courtIds) {
            SportsCourt court = sportsCourts.findByIdForUpdate(id).orElseThrow(() -> conflict("Không tìm thấy sân liên kết."));
            refresh(court); requireOpenCourt(court, session.getStartTime(), session.getEndTime());
        }
        PublicFacility facility = facilities.findByIdForUpdate(session.getFacilityId()).orElseThrow(() -> conflict("Không tìm thấy địa điểm."));
        refresh(facility);
        if (!facility.isActive()) throw conflict("Địa điểm đang đóng.");
        Booking b = bookings.findByIdForUpdate(candidate.getBookingId()).orElseThrow(() -> conflict("Không tìm thấy booking.")); refresh(b);
        if (!memberId.equals(b.getMemberId()) || !session.getSessionId().equals(b.getSessionId()) || !"CONFIRMED".equals(b.getStatus())
                || (payment != null && !payment.getPaymentId().equals(b.getPaymentId()))) throw conflict("Booking lớp không còn hợp lệ.");
        if (Boolean.TRUE.equals(b.getUsesMembershipQuota())) {
            if (b.getMembershipId() == null || !"HELD".equals(memberships.sessionQuotaState(b, b.getAttendanceStatus()))) throw conflict("Quota buổi học không còn được giữ.");
            memberships.requireSessionCheckIn(b.getMembershipId()); requireMembershipOwner(b.getMembershipId(), memberId);
        } else requirePaid(payment, b.getPaymentId(), memberId, b.getFeeAmount(), Set.of("CLASS", "PT"));
        return b;
    }
    @org.springframework.beans.factory.annotation.Autowired private UserMembershipRepository membershipRows;
    private void requireMembershipOwner(Long id, Long memberId) {
        if (membershipRows == null || membershipRows.findByIdForUpdate(id).filter(m -> memberId.equals(m.getUserId())).isEmpty()) throw conflict("Gói không thuộc hội viên.");
    }
    private PaymentTransaction lockPayment(Long id) {
        if (id == null) return null;
        PaymentTransaction payment = payments.findByIdForUpdate(id).orElseThrow(() -> conflict("Thiếu chứng từ thanh toán.")); refresh(payment); return payment;
    }
    private void requirePaid(PaymentTransaction p, Long expectedId, Long member, java.math.BigDecimal expected, Set<String> types) {
        if (p == null || p.getBookingType() == null || !types.contains(p.getBookingType()) || !p.getPaymentId().equals(expectedId) || !member.equals(p.getMemberId()) || !"PAID".equals(p.getPaymentStatus())
                || expected == null || p.getAmount() == null || p.getAmount().compareTo(expected) != 0)
            throw conflict("Booking chưa có chứng từ PAID đúng chủ sở hữu và số tiền; cần đối soát tại quầy.");
    }
    private void requireTime(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (start == null || end == null || start.isAfter(now) || !end.isAfter(now)) throw conflict("Chưa đúng giờ hoặc lịch đã kết thúc.");
    }
    private void requireOpenCourt(SportsCourt court, LocalDateTime start, LocalDateTime end) {
        if (!court.isActive() || maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(court.getCourtId(), end, start))
            throw conflict("Sân đang đóng hoặc có lịch bảo trì; cần đổi lịch/hủy tại quầy, không trừ quota.");
    }
    private void refresh(Object entity) { if (entityManager != null) entityManager.refresh(entity, LockModeType.PESSIMISTIC_WRITE); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
}
