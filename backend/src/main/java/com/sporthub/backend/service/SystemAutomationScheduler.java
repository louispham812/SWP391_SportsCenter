package com.sporthub.backend.service;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.EquipmentLoan;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.EquipmentLoanRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Tác vụ nền tự động hóa hệ thống SportHub:
 * - BR-07: Tự động hủy đơn giữ chỗ quá 10 phút chưa thanh toán và nhả slot.
 * - BR-05: Tự động quét chuyển trạng thái gói tập hết hạn lúc 00:00 và gửi nhắc nhở gia hạn.
 * - BR-14: Tự động gắn nhãn quá hạn cho dụng cụ mượn quá 7 ngày chưa trả và gửi cảnh báo.
 */
@Service
public class SystemAutomationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SystemAutomationScheduler.class);
    private static final List<String> ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED");

    private final BookingRepository bookingRepository;
    private final CourtBookingRepository courtBookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final EquipmentLoanRepository equipmentLoanRepository;
    private final EngagementService engagementService;

    public SystemAutomationScheduler(
            BookingRepository bookingRepository,
            CourtBookingRepository courtBookingRepository,
            ClassSessionRepository classSessionRepository,
            UserMembershipRepository userMembershipRepository,
            EquipmentLoanRepository equipmentLoanRepository,
            EngagementService engagementService) {
        this.bookingRepository = bookingRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.equipmentLoanRepository = equipmentLoanRepository;
        this.engagementService = engagementService;
    }

    @PostConstruct
    public void onStartup() {
        log.info("SystemAutomationScheduler initialized. Performing startup checks...");
        try {
            scanExpiredMembershipsAndEquipment();
        } catch (Exception e) {
            log.warn("Startup scan warning: {}", e.getMessage());
        }
    }

    /**
     * BR-07: Chạy mỗi 60 giây để quét các đơn giữ chỗ tạm thời (PENDING) đã quá 10 phút.
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void autoCancelExpiredPendingHolds() {
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);

        // 1. Quét lớp học (Class Bookings)
        List<Booking> expiredClassHolds = bookingRepository
                .findByStatusIgnoreCaseAndBookingTimeBefore("PENDING", tenMinutesAgo);

        for (Booking b : expiredClassHolds) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
            log.info("BR-07: Auto-cancelled expired pending class booking #{} (memberId={})", b.getBookingId(), b.getMemberId());

            // Nhả lại slot cho lớp học
            classSessionRepository.findById(b.getSessionId()).ifPresent(session -> {
                long currentBooked = bookingRepository.countBySessionIdAndStatusIn(session.getSessionId(), ACTIVE_STATUSES);
                session.setBookedSlots((int) currentBooked);
                classSessionRepository.save(session);
            });
        }

        // 2. Quét đặt sân (Court Bookings)
        List<CourtBooking> expiredCourtHolds = courtBookingRepository
                .findByStatusIgnoreCaseAndCreatedAtBefore("PENDING", tenMinutesAgo);

        for (CourtBooking cb : expiredCourtHolds) {
            cb.setStatus("CANCELLED");
            courtBookingRepository.save(cb);
            log.info("BR-07: Auto-cancelled expired pending court booking #{} (memberId={})", cb.getCourtBookingId(), cb.getMemberId());
        }
    }

    /**
     * BR-05 & BR-14: Chạy hàng ngày vào lúc 00:00 nửa đêm để quét gói tập hết hạn & mượn đồ quá 7 ngày.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void scanExpiredMembershipsAndEquipment() {
        LocalDate today = LocalDate.now();

        // 1. Quét các gói tập đã hết hạn (endDate < today)
        List<UserMembership> expiredMemberships = userMembershipRepository
                .findByStatusIgnoreCaseAndEndDateBefore("ACTIVE", today);

        for (UserMembership m : expiredMemberships) {
            m.setStatus("EXPIRED");
            userMembershipRepository.save(m);
            log.info("BR-05: Expired membership #{} for userId={}", m.getMembershipId(), m.getUserId());

            if (engagementService != null) {
                engagementService.notifyUser(
                        m.getUserId(),
                        "Gói hội viên đã hết hạn",
                        "Gói tập của bạn đã hết hạn vào ngày " + m.getEndDate() + ". Vui lòng gia hạn để tiếp tục sử dụng các đặc quyền VIP.",
                        "MEMBERSHIP"
                );
            }
        }

        // 2. Nhắc nhở gia hạn trước 3 ngày (endDate == today + 3 ngày)
        LocalDate threeDaysLater = today.plusDays(3);
        List<UserMembership> expiringSoon = userMembershipRepository
                .findByStatusIgnoreCaseAndEndDate("ACTIVE", threeDaysLater);

        for (UserMembership m : expiringSoon) {
            if (engagementService != null) {
                engagementService.notifyUser(
                        m.getUserId(),
                        "Nhắc nhở gia hạn gói tập",
                        "Gói tập của bạn sẽ hết hạn sau 3 ngày nữa (ngày " + m.getEndDate() + "). Hãy gia hạn sớm để duy trì quyền lợi tập luyện nhé!",
                        "MEMBERSHIP"
                );
            }
        }

        // 3. BR-14: Quét đồ mượn quá 7 ngày (loanedAt < now - 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<EquipmentLoan> overdueLoans = equipmentLoanRepository
                .findByStatusIgnoreCaseAndLoanedAtBefore("BORROWED", sevenDaysAgo);

        for (EquipmentLoan loan : overdueLoans) {
            loan.setStatus("OVERDUE");
            equipmentLoanRepository.save(loan);
            log.warn("BR-14: Equipment loan #{} marked OVERDUE for memberId={}", loan.getLoanId(), loan.getMemberId());

            if (engagementService != null) {
                engagementService.notifyUser(
                        loan.getMemberId(),
                        "Dụng cụ mượn quá hạn (7 ngày)",
                        "Dụng cụ \"" + loan.getItemName() + "\" bạn mượn tại quầy lễ tân đã quá hạn 7 ngày. Vui lòng hoàn trả sớm để tránh phí phạt.",
                        "EQUIPMENT"
                );
            }
        }
    }
}
