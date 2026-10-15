package com.sporthub.backend.controller;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReceptionistControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final ReceptionPaymentRepository paymentRepository = mock(ReceptionPaymentRepository.class);
    private final PaymentTransactionRepository paymentTransactionRepository =
            mock(PaymentTransactionRepository.class);
    private final UserMembershipRepository membershipRepository = mock(UserMembershipRepository.class);
    private final MembershipPackageRepository packageRepository = mock(MembershipPackageRepository.class);
    private final MemberCheckInRepository checkInRepository = mock(MemberCheckInRepository.class);
    private final ReceptionistController controller = new ReceptionistController(
            userRepository,
            paymentRepository,
            paymentTransactionRepository,
            membershipRepository,
            packageRepository,
            checkInRepository);
    private final UsernamePasswordAuthenticationToken receptionist =
            new UsernamePasswordAuthenticationToken(
                    "3", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));

    @Test
    void memberSearchReturnsPaginatedMemberSummaries() {
        User member = User.builder()
                .userId(9L)
                .fullName("Nguyễn Anh Khoa")
                .email("member@example.com")
                .phone("0900000000")
                .status("ACTIVE")
                .build();
        when(userRepository.searchMembers(eq("Khoa"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(member), PageRequest.of(0, 20), 1));

        var result = controller.searchMembers("Khoa", 0, 20, receptionist);

        assertEquals(1, result.getTotalElements());
        assertEquals("Nguyễn Anh Khoa", result.getContent().get(0).fullName());
    }

    @Test
    void reportSumsCompletedPaymentsAcrossBothPaymentTables() {
        LocalDate reportDate = LocalDate.of(2026, 10, 13);
        LocalDateTime createdAt = reportDate.atTime(9, 30);
        ReceptionPayment membershipPayment = new ReceptionPayment();
        membershipPayment.setPaymentId(1);
        membershipPayment.setMemberId(9);
        membershipPayment.setAmount(new BigDecimal("100000"));
        membershipPayment.setPaymentMethod("CASH");
        membershipPayment.setPaymentStatus("COMPLETED");
        membershipPayment.setCreatedAt(createdAt);
        ReceptionPayment pendingPayment = new ReceptionPayment();
        pendingPayment.setPaymentId(2);
        pendingPayment.setMemberId(9);
        pendingPayment.setAmount(new BigDecimal("500000"));
        pendingPayment.setPaymentMethod("POS");
        pendingPayment.setPaymentStatus("PENDING");
        pendingPayment.setCreatedAt(createdAt.plusMinutes(1));

        PaymentTransaction bookingPayment = new PaymentTransaction();
        bookingPayment.setPaymentId(3L);
        bookingPayment.setMemberId(9L);
        bookingPayment.setAmount(new BigDecimal("200000"));
        bookingPayment.setPaymentMethod("SANDBOX");
        bookingPayment.setPaymentStatus("PAID");
        bookingPayment.setCreatedAt(createdAt.plusMinutes(2));

        User member = User.builder().userId(9L).fullName("Nguyễn Anh Khoa").build();
        when(paymentRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(pendingPayment, membershipPayment));
        when(paymentTransactionRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(bookingPayment));
        when(userRepository.findAllById(List.of(9L))).thenReturn(List.of(member));
        when(userRepository.countByRoleIgnoreCaseAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                "MEMBER", reportDate.atStartOfDay(), reportDate.plusDays(1).atStartOfDay()))
                .thenReturn(1L);

        var result = controller.getDailyReport(reportDate, receptionist);

        assertEquals(new BigDecimal("300000"), result.totalRevenue());
        assertEquals(2, result.completedPayments());
        assertEquals(1, result.newMembers());
        assertEquals(3, result.payments().size());
        assertEquals(2, result.paymentMethods().size());
    }
}
