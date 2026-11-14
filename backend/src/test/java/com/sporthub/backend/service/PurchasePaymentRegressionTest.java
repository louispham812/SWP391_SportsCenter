package com.sporthub.backend.service;

import com.sporthub.backend.controller.MemberProfileController;
import com.sporthub.backend.controller.PaymentCollectionController;
import com.sporthub.backend.controller.VoucherController;
import com.sporthub.backend.dto.MemberPackagePurchaseRequest;
import com.sporthub.backend.dto.SaveVoucherRequest;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.payment.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PurchasePaymentRegressionTest {
    private final UserMembershipRepository memberships = mock(UserMembershipRepository.class);
    private final MembershipPackageRepository packages = mock(MembershipPackageRepository.class);
    private final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
    private final ReceptionPaymentRepository receipts = mock(ReceptionPaymentRepository.class);
    private final UserRepository users = mock(UserRepository.class);

    private MemberProfileController controller() {
        when(packages.findById(2L)).thenReturn(Optional.of(MembershipPackage.builder()
            .packageId(2L).name("VIP").status("ACTIVE").price(BigDecimal.valueOf(100)).build()));
        return new MemberProfileController(users, mock(MemberHealthProfileRepository.class), memberships, packages,
            receipts, payments, mock(BookingRepository.class), mock(ClassSessionRepository.class),
            mock(MemberCheckInRepository.class), mock(PublicSportRepository.class), new PaymentService(payments));
    }

    private UsernamePasswordAuthenticationToken member() {
        return new UsernamePasswordAuthenticationToken("9", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
    }

    @Test void duplicatePendingPurchaseIsRejectedBeforeCreatingAnyPayment() {
        var controller = controller();
        when(memberships.existsByUserIdAndPackageIdAndStatusIn(eq(9L), eq(2L), anyList())).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class,
            () -> controller.purchaseMembership(new MemberPackagePurchaseRequest(2L, "VNPAY"), member()));
        assertEquals(409, error.getStatusCode().value());
        verify(users).findByIdForUpdate(9L);
        verify(memberships, never()).save(any());
        verifyNoInteractions(payments, receipts);
    }

    @Test void cashPurchaseRemainsUnpaidAndVisibleUntilCashierConfirms() {
        var controller = controller();
        when(memberships.save(any())).thenAnswer(i -> { UserMembership m = i.getArgument(0); m.setMembershipId(3L); return m; });
        when(receipts.save(any())).thenAnswer(i -> i.getArgument(0));
        when(payments.save(any())).thenAnswer(i -> { PaymentTransaction p = i.getArgument(0); p.setPaymentId(4L); return p; });
        var result = controller.purchaseMembership(new MemberPackagePurchaseRequest(2L, "CASH_COUNTER"), member());
        assertEquals("PENDING", result.paymentStatus());
        var membership = org.mockito.ArgumentCaptor.forClass(UserMembership.class);
        verify(memberships).save(membership.capture());
        assertEquals("PENDING_PAYMENT", membership.getValue().getStatus());
        assertNull(membership.getValue().getStartDate());
        var payment = org.mockito.ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(payments, times(2)).save(payment.capture());
        assertNull(payment.getValue().getPaymentCompletedAt());
        when(memberships.findByUserIdOrderByEndDateDesc(9L)).thenReturn(List.of(membership.getValue()));
        when(payments.findFirstByMembershipIdOrderByCreatedAtDesc(3L)).thenReturn(Optional.of(payment.getValue()));
        var visible = controller.getMemberships(member()).getFirst();
        assertEquals(2L, visible.packageId());
        assertEquals(4L, visible.paymentId());
        assertEquals("PENDING_PAYMENT", visible.status());
    }

    @Test void fullyDiscountedMembershipWaitsForApprovalAndBothLedgersAgree() {
        var controller = controller();
        when(memberships.save(any())).thenAnswer(i -> { UserMembership m = i.getArgument(0); m.setMembershipId(3L); return m; });
        when(receipts.save(any())).thenAnswer(i -> i.getArgument(0));
        when(payments.save(any())).thenAnswer(i -> { PaymentTransaction p = i.getArgument(0); p.setPaymentId(4L); return p; });
        var vouchers = mock(VoucherRepository.class);
        var voucher = Voucher.builder().voucherId(5L).code("FREE").discountType("PERCENT")
            .discountValue(BigDecimal.valueOf(100)).appliesTo("MEMBERSHIP_ONLY").build();
        when(vouchers.findByCodeForUpdate("FREE")).thenReturn(Optional.of(voucher));
        ReflectionTestUtils.setField(controller, "voucherService", new VoucherService(vouchers, payments));
        var result = controller.purchaseMembership(new MemberPackagePurchaseRequest(2L, "VNPAY", "FREE"), member());
        assertEquals("PAID", result.paymentStatus()); assertEquals(0, result.amount().signum());
        var membership = org.mockito.ArgumentCaptor.forClass(UserMembership.class);
        verify(memberships, times(2)).save(membership.capture());
        assertEquals("PENDING_APPROVAL", membership.getValue().getStatus());
        assertNull(membership.getValue().getStartDate());
        var receipt = org.mockito.ArgumentCaptor.forClass(ReceptionPayment.class);
        verify(receipts, times(2)).save(receipt.capture());
        assertEquals(0, receipt.getValue().getAmount().signum());
        assertEquals("COMPLETED", receipt.getValue().getPaymentStatus());
    }

    @Test void paymentHandlersRefuseUnpaidTransactions() {
        PaymentTransaction payment = new PaymentTransaction(); payment.setPaymentStatus("PENDING");
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class);
        var engagement = mock(EngagementService.class);
        List<BookingPaymentHandler> handlers = List.of(new ClassBookingPaymentHandler(bookings, engagement),
            new CourtBookingPaymentHandler(courts, engagement), new MembershipPaymentHandler(receipts, memberships, engagement));
        for (var handler : handlers) assertThrows(IllegalStateException.class, () -> handler.handlePaymentConfirmation(payment, 100d));
        verifyNoInteractions(bookings, courts, memberships, receipts, engagement);
    }

    @Test void cashierConfirmationMovesMembershipToApprovalWithoutActivatingIt() {
        var payment = new PaymentTransaction(); payment.setPaymentId(4L); payment.setMemberId(9L);
        payment.setMembershipId(3L); payment.setBookingType("MEMBERSHIP_PACKAGE"); payment.setAmount(BigDecimal.valueOf(100));
        payment.setPaymentStatus("PENDING"); payment.setPaymentMethod("CASH_COUNTER"); payment.setCreatedAt(LocalDateTime.now());
        var membership = new UserMembership(); membership.setMembershipId(3L); membership.setUserId(9L); membership.setStatus("PENDING_PAYMENT");
        when(payments.findByIdForUpdate(4L)).thenReturn(Optional.of(payment));
        when(memberships.findByIdForUpdate(3L)).thenReturn(Optional.of(membership));
        var engagement = mock(EngagementService.class);
        var handler = new MembershipPaymentHandler(receipts, memberships, engagement);
        var controller = new PaymentCollectionController(payments, List.of(handler), engagement);
        var staff = new UsernamePasswordAuthenticationToken("1", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));
        controller.confirmCash(4L, staff);
        assertEquals("PAID", payment.getPaymentStatus());
        assertNotNull(payment.getPaymentCompletedAt());
        assertEquals("PENDING_APPROVAL", membership.getStatus());
        assertNull(membership.getStartDate());
        assertThrows(ResponseStatusException.class, () -> controller.confirmCash(4L, staff));
    }

    @Test void membershipVoucherUsesMembershipScopeAndPersistsDiscountedAmount() {
        var vouchers = mock(VoucherRepository.class);
        var voucher = Voucher.builder().voucherId(5L).code("VIP20").discountType("PERCENT")
            .discountValue(BigDecimal.valueOf(20)).appliesTo("MEMBERSHIP_ONLY").build();
        when(vouchers.findByCodeForUpdate("VIP20")).thenReturn(Optional.of(voucher));
        var service = new VoucherService(vouchers, payments);
        var payment = new PaymentTransaction(); payment.setBookingType("MEMBERSHIP_PACKAGE"); payment.setAmount(BigDecimal.valueOf(100)); payment.setPaymentStatus("PENDING");
        service.apply(payment, "VIP20");
        assertEquals(0, BigDecimal.valueOf(80).compareTo(payment.getAmount()));
        assertEquals(5L, payment.getVoucherId()); assertEquals(1, voucher.getUsedCount());
        assertThrows(ResponseStatusException.class, () -> service.discount(voucher, BigDecimal.valueOf(100), "BOOKING_ONLY"));
        verify(payments).save(payment);
    }

    @Test void invalidVoucherCannotBeReportedAsSaved() {
        var vouchers = mock(VoucherRepository.class); var controller = new VoucherController(vouchers);
        var request = new SaveVoucherRequest("BAD", "PERCENT", BigDecimal.valueOf(101), BigDecimal.ZERO,
            LocalDate.now(), LocalDate.now().plusDays(1), 10, "ALL", "ACTIVE");
        assertThrows(ResponseStatusException.class, () -> controller.createVoucher(request));
        verify(vouchers, never()).save(any());
    }

    @Test void failedExpiredPaymentNoLongerLeavesMembershipPendingForever() {
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class);
        var scheduler = new PaymentTimeoutScheduler(bookings, courts, payments, null);
        ReflectionTestUtils.setField(scheduler, "memberships", memberships);
        var payment = new PaymentTransaction(); payment.setPaymentId(4L); payment.setMembershipId(3L); payment.setPaymentStatus("FAILED");
        var membership = new UserMembership(); membership.setStatus("PENDING_PAYMENT");
        when(payments.findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(eq("MEMBERSHIP_PACKAGE"), eq("FAILED"), any())).thenReturn(List.of(payment));
        when(payments.findByIdForUpdate(4L)).thenReturn(Optional.of(payment));
        when(memberships.findByIdForUpdate(3L)).thenReturn(Optional.of(membership));
        scheduler.cancelUnpaidBookings();
        assertEquals("CANCELLED", membership.getStatus()); verify(memberships).save(membership);
    }
}
