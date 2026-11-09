package com.sporthub.backend.service;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.enums.AttendanceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingLifecycleService {
    private final BookingRepository bookings;
    private final CourtBookingRepository courts;
    private final ClassSessionRepository sessions;
    private final SportsCourtRepository sportsCourts;
    private final UserMembershipRepository memberships;
    private final MembershipService quotas;
    private final PaymentService payments;
    private final EngagementService engagement;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.transaction.PlatformTransactionManager transactionManager;
    @org.springframework.beans.factory.annotation.Autowired(required = false) private CourtMaintenanceRepository maintenance;
    @org.springframework.beans.factory.annotation.Autowired(required = false) private FacilityCourtSyncService facilitySync;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BookingLifecycleService.class);
    public BookingLifecycleService(BookingRepository bookings, CourtBookingRepository courts, ClassSessionRepository sessions,
            SportsCourtRepository sportsCourts, UserMembershipRepository memberships, MembershipService quotas, PaymentService payments, EngagementService engagement) {
        this.bookings = bookings; this.courts = courts; this.sessions = sessions; this.sportsCourts = sportsCourts;
        this.memberships = memberships; this.quotas = quotas; this.payments = payments; this.engagement = engagement;
    }
    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    public void reconcile() {
        LocalDateTime now = LocalDateTime.now();
        for (CourtBooking candidate : courts.findByStatus("CONFIRMED")) {
            if (candidate.getEndTime() != null && !candidate.getEndTime().isAfter(now))
                attempt("court=" + candidate.getCourtBookingId(), () -> courtNoShow(candidate.getCourtBookingId(), now));
        }
        for (Booking candidate : bookings.findByStatus("CONFIRMED"))
            attempt("class=" + candidate.getBookingId(), () -> classNoShow(candidate.getBookingId(), now));
        for (UserMembership candidate : memberships.findByStatusIgnoreCase("ACTIVE")) {
            if (candidate.getEndDate() != null && candidate.getEndDate().isBefore(LocalDate.now()))
                attempt("membership=" + candidate.getMembershipId(), () -> expire(candidate.getMembershipId(), now));
        }
        for (UserMembership candidate : memberships.findByStatusIgnoreCase("EXPIRED"))
            attempt("membership=" + candidate.getMembershipId(), () -> expire(candidate.getMembershipId(), now));
    }

    private void attempt(String item, Runnable task) {
        try {
            if (transactionManager == null) task.run();
            else {
                var transaction = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
                transaction.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                transaction.executeWithoutResult(status -> task.run());
            }
        } catch (RuntimeException error) {
            // An inconsistent legacy row must not stop processing every other member.
            log.error("Lifecycle reconciliation failed for {}: {}", item, error.getMessage());
        }
    }

    private void courtNoShow(Long id, LocalDateTime now) {
        CourtBooking b = courts.findByIdForUpdate(id).orElseThrow();
        if (!"CONFIRMED".equals(b.getStatus()) || b.getEndTime().isAfter(now)) return;
        if (maintenance != null && maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(b.getCourtId(), b.getEndTime(), b.getStartTime())) return;
        if (Boolean.TRUE.equals(b.getUsesMembershipQuota())) {
            if (b.getQuotaState() != null && !"HELD".equals(b.getQuotaState())) throw new IllegalStateException("Booking sân không ở trạng thái giữ quota.");
            quotas.consumeCourtQuota(b.getMembershipId(), b.getQuotaHoursUsed().doubleValue()); b.setQuotaState("USED");
        }
        b.setStatus("NO_SHOW"); courts.save(b);
        engagement.audit(b.getMemberId(), "SYSTEM", "COURT_NO_SHOW", "bookingId=" + b.getCourtBookingId());
    }

    private void classNoShow(Long id, LocalDateTime now) {
        Booking b = bookings.findByIdForUpdate(id).orElseThrow();
        ClassSession session = sessions.findById(b.getSessionId()).orElse(null);
        if (session == null || session.getEndTime() == null || session.getEndTime().isAfter(now) || "CANCELLED".equals(session.getStatus())) return;
        if (maintenance != null && facilitySync != null && session.getFacilityId() != null
                && facilitySync.getCourtIdsForFacility(session.getFacilityId(), session.getSportId(), null).stream()
                    .anyMatch(courtId -> maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(courtId, session.getEndTime(), session.getStartTime()))) return;
        if (!"CONFIRMED".equals(b.getStatus()) || (b.getAttendanceStatus() != null && b.getAttendanceStatus() != AttendanceStatus.PENDING)) return;
        if (Boolean.TRUE.equals(b.getUsesMembershipQuota())) {
            if (b.getQuotaState() != null && !"HELD".equals(b.getQuotaState())) throw new IllegalStateException("Booking lớp không ở trạng thái giữ quota.");
            quotas.consumeQuota(b.getMembershipId(), 1); b.setQuotaState("USED");
        }
        b.setAttendanceStatus(AttendanceStatus.UNEXCUSED_ABSENCE); bookings.save(b);
        engagement.audit(b.getMemberId(), "SYSTEM", "CLASS_NO_SHOW", "bookingId=" + b.getBookingId());
    }

    private void expire(Long membershipId, LocalDateTime now) {
        UserMembership m = memberships.findByIdForUpdate(membershipId).orElseThrow();
        for (CourtBooking candidate : courts.findByMemberIdOrderByStartTimeAsc(m.getUserId())) {
            if (!membershipId.equals(candidate.getMembershipId()) || !Boolean.TRUE.equals(candidate.getUsesMembershipQuota()) || !"CONFIRMED".equals(candidate.getStatus())) continue;
            CourtBooking b = courts.findByIdForUpdate(candidate.getCourtBookingId()).orElseThrow();
            if (!Boolean.TRUE.equals(b.getUsesMembershipQuota()) || !"CONFIRMED".equals(b.getStatus())) continue;
            if (b.getQuotaState() != null && !"HELD".equals(b.getQuotaState())) continue;
            int hours = (int) Math.ceil(b.getQuotaHoursUsed().doubleValue());
            boolean closed = maintenance != null && maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(b.getCourtId(), b.getEndTime(), b.getStartTime());
            if (closed) {
                    forfeitHeld(m, hours, true); b.setQuotaState("FORFEITED"); b.setUsesMembershipQuota(false); b.setStatus("CANCELLED"); courts.save(b);
                    notifyMaintenanceCancellation(m.getUserId(), b.getCourtBookingId(), "COURT");
                    continue;
            }
            if (!b.getEndTime().isAfter(now)) {
                courtNoShow(b.getCourtBookingId(), now);
                continue;
            }
            SportsCourt court = sportsCourts.findById(b.getCourtId()).orElseThrow();
            BigDecimal amount = court.getHourlyRate().multiply(BigDecimal.valueOf(Math.ceil(Duration.between(b.getStartTime(), b.getEndTime()).toMinutes() / 60.0)));
            PaymentTransaction payment = payments.createPayment(m.getUserId(), "COURT", amount, "VNPAY");
            forfeitHeld(m, hours, true); b.setQuotaState("FORFEITED"); b.setUsesMembershipQuota(false);
            b.setPaymentId(payment.getPaymentId()); b.setAmountPaid(amount); b.setCreatedAt(now);
            b.setStatus(amount.signum() == 0 ? "CONFIRMED" : "PENDING"); courts.save(b); notifyExpiry(m.getUserId(), payment.getPaymentId());
        }
        for (Booking candidate : bookings.findByMemberId(m.getUserId())) {
            if (!membershipId.equals(candidate.getMembershipId()) || !Boolean.TRUE.equals(candidate.getUsesMembershipQuota()) || !"CONFIRMED".equals(candidate.getStatus())
                    || (candidate.getAttendanceStatus() != null && candidate.getAttendanceStatus() != AttendanceStatus.PENDING)) continue;
            Booking b = bookings.findByIdForUpdate(candidate.getBookingId()).orElseThrow();
            if (!Boolean.TRUE.equals(b.getUsesMembershipQuota()) || !"CONFIRMED".equals(b.getStatus())
                    || (b.getAttendanceStatus() != null && b.getAttendanceStatus() != AttendanceStatus.PENDING)) continue;
            if (b.getQuotaState() != null && !"HELD".equals(b.getQuotaState())) continue;
            ClassSession session = sessions.findById(b.getSessionId()).orElseThrow();
            boolean closed = "CANCELLED".equals(session.getStatus()) || isClassUnderMaintenance(session);
            if (closed) {
                forfeitHeld(m, 1, false); b.setQuotaState("FORFEITED"); b.setUsesMembershipQuota(false); b.setStatus("CANCELLED"); bookings.save(b);
                session.setBookedSlots((int) bookings.countBySessionIdAndStatusIn(session.getSessionId(), List.of("BOOKED", "CONFIRMED"))); sessions.save(session);
                notifyMaintenanceCancellation(m.getUserId(), b.getBookingId(), "CLASS"); continue;
            }
            if (!session.getEndTime().isAfter(now)) { classNoShow(b.getBookingId(), now); continue; }
            BigDecimal amount = session.getPriceAmount();
            boolean pt = session.getMaxSlots() == 1 && session.getClassName().startsWith("Huấn Luyện 1-1");
            if (pt && (amount == null || amount.signum() == 0)) amount = BigDecimal.valueOf(250000).multiply(BigDecimal.valueOf(Math.max(1.0, Duration.between(session.getStartTime(), session.getEndTime()).toMinutes() / 60.0)));
            if (amount == null) throw new IllegalStateException("Buổi học chưa có giá lẻ.");
            PaymentTransaction payment = payments.createPayment(m.getUserId(), pt ? "PT" : "CLASS", amount, "VNPAY");
            forfeitHeld(m, 1, false); b.setQuotaState("FORFEITED"); b.setUsesMembershipQuota(false);
            b.setFeeAmount(amount); b.setPaymentId(payment.getPaymentId()); b.setBookingTime(now);
            b.setStatus(amount.signum() == 0 ? "CONFIRMED" : "BOOKED"); bookings.save(b); notifyExpiry(m.getUserId(), payment.getPaymentId());
        }
        // Only referenced holds were settled. Never silently erase orphan/inconsistent legacy holds.
        m.setStatus("EXPIRED"); memberships.save(m);
        if (nz(m.getHeldQuotaSessions()) > 0 || nz(m.getHeldQuotaCourts()) > 0)
            log.warn("Expired membership {} retains unresolved holds for reconciliation", membershipId);
    }
    @Transactional
    public void settleExpiredMembership(Long membershipId) {
        UserMembership m = memberships.findByIdForUpdate(membershipId).orElseThrow();
        if (m.getEndDate() == null || !m.getEndDate().isBefore(LocalDate.now()) || !List.of("ACTIVE", "EXPIRED").contains(m.getStatus()))
            throw new IllegalStateException("Chỉ quyết toán gói đã hết hạn.");
        expire(membershipId, LocalDateTime.now());
    }
    private boolean isClassUnderMaintenance(ClassSession s) {
        return maintenance != null && facilitySync != null && s.getFacilityId() != null
            && facilitySync.getCourtIdsForFacility(s.getFacilityId(), s.getSportId(), null).stream()
                .anyMatch(id -> maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(id, s.getEndTime(), s.getStartTime()));
    }
    private void forfeitHeld(UserMembership m, int units, boolean court) {
        if (units <= 0) throw new IllegalStateException("Quota giữ không hợp lệ.");
        if (court) quotas.validateCourtQuotaFormula(m); else quotas.validateQuotaFormula(m);
        if (court) {
            if (nz(m.getHeldQuotaCourts()) < units) throw new IllegalStateException("Thiếu quota sân đang giữ để quyết toán booking.");
            m.setHeldQuotaCourts(nz(m.getHeldQuotaCourts()) - units); m.setRemainingQuotaCourts(nz(m.getRemainingQuotaCourts()) + units);
        } else {
            if (nz(m.getHeldQuotaSessions()) < units) throw new IllegalStateException("Thiếu quota buổi đang giữ để quyết toán booking.");
            m.setHeldQuotaSessions(nz(m.getHeldQuotaSessions()) - units); m.setRemainingQuotaSessions(nz(m.getRemainingQuotaSessions()) + units);
        }
        // The returned balance is historical only: the expired term cannot spend it.
        if (court) quotas.validateCourtQuotaFormula(m); else quotas.validateQuotaFormula(m);
        memberships.save(m);
    }
    private void notifyMaintenanceCancellation(Long user, Long booking, String type) {
        engagement.audit(user, "SYSTEM", "EXPIRED_MAINTENANCE_HOLD_SETTLED", "type=" + type + ", bookingId=" + booking);
        engagement.notifyUser(user, "Lịch bị hủy do bảo trì", "Lịch #" + booking + " đã đóng và quyết toán quota; không tính no-show. Gói đã hết hạn nên quota không được dùng lại.", "BOOKING");
    }
    private int nz(Integer value) { return value == null ? 0 : value; }
    private void notifyExpiry(Long user, Long paymentId) {
        engagement.notifyUser(user, "Gói hết hạn: lịch chuyển sang giá lẻ", "Giao dịch #" + paymentId + " cần thanh toán trong 10 phút để tiếp tục giữ chỗ.", "PAYMENT");
        engagement.audit(user, "SYSTEM", "EXPIRED_QUOTA_CONVERTED", "paymentId=" + paymentId);
    }
}
