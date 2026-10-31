package com.sporthub.backend.service;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled task để tự động CANCEL các booking chưa thanh toán sau 10 phút
 * 
 * Rule 7: Hạn giữ chỗ 10 phút tính từ booking_time (lớp/PT) hoặc created_at (sân)
 * Rule 3: Lớp/PT - booking BOOKED + payment PENDING → quá 10 phút → booking CANCELLED + payment FAILED
 * Rule 2: Sân - booking BOOKED + payment PENDING → quá 10 phút → booking CANCELLED
 */
@Service
public class PaymentTimeoutScheduler {

    private static final int TIMEOUT_MINUTES = 10;
    
    private final BookingRepository bookingRepository;
    private final CourtBookingRepository courtBookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EngagementService engagementService;

    public PaymentTimeoutScheduler(
            BookingRepository bookingRepository,
            CourtBookingRepository courtBookingRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            EngagementService engagementService) {
        this.bookingRepository = bookingRepository;
        this.courtBookingRepository = courtBookingRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.engagementService = engagementService;
    }

    /**
     * Chạy mỗi 1 phút để scan bookings timeout
     * Rule 7: 10 phút timeout
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 60000) // Every 1 minute
    @Transactional
    public void cancelUnpaidBookings() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES);
        
        // Rule 3: Handle CLASS/PT bookings (bookings table)
        List<Booking> unpaidClassBookings = bookingRepository
            .findByStatusIgnoreCaseAndBookingTimeBefore(PaymentConstants.BOOKING_STATUS_BOOKED, cutoffTime)
            .stream()
            .filter(b -> {
                // Check if payment is NOT PAID
                if (b.getPaymentId() == null) return false; // No payment, might be quota booking
                PaymentTransaction payment = paymentTransactionRepository.findById(b.getPaymentId()).orElse(null);
                return payment != null && !PaymentConstants.PAYMENT_STATUS_PAID.equalsIgnoreCase(payment.getPaymentStatus());
            })
            .toList();
        
        for (Booking booking : unpaidClassBookings) {
            try {
                // Cancel booking
                booking.setStatus(PaymentConstants.BOOKING_STATUS_CANCELLED);
                bookingRepository.save(booking);
                
                // Mark payment as FAILED
                if (booking.getPaymentId() != null) {
                    PaymentTransaction payment = paymentTransactionRepository.findById(booking.getPaymentId()).orElse(null);
                    if (payment != null && !PaymentConstants.PAYMENT_STATUS_PAID.equalsIgnoreCase(payment.getPaymentStatus())) {
                        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_FAILED);
                        paymentTransactionRepository.save(payment);
                    }
                }
                
                System.out.println("✂ Auto-cancelled CLASS booking #" + booking.getBookingId() + " (unpaid after " + TIMEOUT_MINUTES + " minutes)");
                
                // Notify user
                if (engagementService != null) {
                    engagementService.notifyUser(
                        booking.getMemberId(),
                        "Booking đã bị hủy",
                        "Lớp học #" + booking.getBookingId() + " đã bị hủy do không thanh toán trong " + TIMEOUT_MINUTES + " phút.",
                        "BOOKING"
                    );
                }
            } catch (Exception e) {
                System.err.println("Error cancelling CLASS booking #" + booking.getBookingId() + ": " + e.getMessage());
            }
        }
        
        // Rule 2: Handle COURT bookings (court_bookings table)
        List<CourtBooking> unpaidCourtBookings = courtBookingRepository
            .findByStatusIgnoreCaseAndCreatedAtBefore(PaymentConstants.BOOKING_STATUS_PENDING, cutoffTime)
            .stream()
            .filter(cb -> {
                // Check if payment is NOT PAID
                if (cb.getPaymentId() == null) return false;
                PaymentTransaction payment = paymentTransactionRepository.findById(cb.getPaymentId()).orElse(null);
                return payment != null && !PaymentConstants.PAYMENT_STATUS_PAID.equalsIgnoreCase(payment.getPaymentStatus());
            })
            .toList();
        
        for (CourtBooking courtBooking : unpaidCourtBookings) {
            try {
                // Cancel court booking
                courtBooking.setStatus(PaymentConstants.BOOKING_STATUS_CANCELLED);
                courtBookingRepository.save(courtBooking);
                
                // Mark payment as FAILED
                if (courtBooking.getPaymentId() != null) {
                    PaymentTransaction payment = paymentTransactionRepository.findById(courtBooking.getPaymentId()).orElse(null);
                    if (payment != null && !PaymentConstants.PAYMENT_STATUS_PAID.equalsIgnoreCase(payment.getPaymentStatus())) {
                        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_FAILED);
                        paymentTransactionRepository.save(payment);
                    }
                }
                
                System.out.println("✂ Auto-cancelled COURT booking #" + courtBooking.getCourtBookingId() + " (unpaid after " + TIMEOUT_MINUTES + " minutes)");
                
                // Notify user
                if (engagementService != null) {
                    engagementService.notifyUser(
                        courtBooking.getMemberId(),
                        "Đặt sân đã bị hủy",
                        "Đặt sân #" + courtBooking.getCourtBookingId() + " đã bị hủy do không thanh toán trong " + TIMEOUT_MINUTES + " phút.",
                        "BOOKING"
                    );
                }
            } catch (Exception e) {
                System.err.println("Error cancelling COURT booking #" + courtBooking.getCourtBookingId() + ": " + e.getMessage());
            }
        }
        
        if (!unpaidClassBookings.isEmpty() || !unpaidCourtBookings.isEmpty()) {
            System.out.println("✓ Payment timeout check completed: " + 
                unpaidClassBookings.size() + " class bookings, " + 
                unpaidCourtBookings.size() + " court bookings cancelled.");
        }
        
        // Rule: Handle MEMBERSHIP_PACKAGE payments (payment_transactions table)
        List<PaymentTransaction> unpaidPackagePayments = paymentTransactionRepository
            .findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(
                PaymentConstants.BOOKING_TYPE_MEMBERSHIP, 
                PaymentConstants.PAYMENT_STATUS_PENDING, 
                cutoffTime);
        
        for (PaymentTransaction payment : unpaidPackagePayments) {
            try {
                // Mark payment as FAILED
                payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_FAILED);
                paymentTransactionRepository.save(payment);
                
                System.out.println("✂ Auto-failed MEMBERSHIP_PACKAGE payment #" + payment.getPaymentId() + " (unpaid after " + TIMEOUT_MINUTES + " minutes)");
                
                // Note: UserMembership remains in PENDING_APPROVAL state
                // Manager will see it as not yet approved, won't activate
                
                // Notify user
                if (engagementService != null) {
                    engagementService.notifyUser(
                        payment.getMemberId(),
                        "Thanh toán gói tập hết hạn",
                        "Thanh toán cho gói tập đã hết hạn do không hoàn tất trong " + TIMEOUT_MINUTES + " phút. Vui lòng đăng ký lại nếu muốn tiếp tục.",
                        "PAYMENT"
                    );
                }
            } catch (Exception e) {
                System.err.println("Error failing MEMBERSHIP_PACKAGE payment #" + payment.getPaymentId() + ": " + e.getMessage());
            }
        }
        
        if (!unpaidPackagePayments.isEmpty()) {
            System.out.println("✓ Payment timeout check: " + unpaidPackagePayments.size() + " package payments marked as FAILED.");
        }
    }
}
