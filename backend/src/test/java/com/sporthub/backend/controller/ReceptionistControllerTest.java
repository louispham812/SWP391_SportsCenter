package com.sporthub.backend.controller;

import static org.mockito.Mockito.lenient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;

class ReceptionistControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final ReceptionPaymentRepository paymentRepository = mock(ReceptionPaymentRepository.class);
    private final PaymentTransactionRepository paymentTransactionRepository =
            mock(PaymentTransactionRepository.class);
    private final UserMembershipRepository membershipRepository = mock(UserMembershipRepository.class);
    private final MembershipPackageRepository packageRepository = mock(MembershipPackageRepository.class);
    private final MemberCheckInRepository checkInRepository = mock(MemberCheckInRepository.class);
    private final com.sporthub.backend.service.EmailService emailService = mock(com.sporthub.backend.service.EmailService.class);
    private final com.sporthub.backend.service.AuditLogService auditLogService = mock(com.sporthub.backend.service.AuditLogService.class);
    private final com.sporthub.backend.service.AuthService authService = mock(com.sporthub.backend.service.AuthService.class);
    private final ReceptionistController controller = new ReceptionistController(
            userRepository,
            paymentRepository,
            paymentTransactionRepository,
            membershipRepository,
            packageRepository,
            checkInRepository,
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(),
            emailService,
            auditLogService,
            authService);
    private final UsernamePasswordAuthenticationToken receptionist =
            new UsernamePasswordAuthenticationToken(
                    "3", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));

    @Test
    void receptionEndpointRejectsCheckInWhenBookingValidationFails() {
        var checkInService = mock(com.sporthub.backend.service.CheckInService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(controller, "checkInService", checkInService);
        User member = User.builder().userId(9L).role("MEMBER").status("ACTIVE").build();
        var membership = new com.sporthub.backend.entity.UserMembership();
        membership.setStatus("ACTIVE");
        membership.setStartDate(LocalDate.now().minusDays(1));
        membership.setEndDate(LocalDate.now().plusDays(10));
        lenient().when(userRepository.findById(9L)).thenReturn(java.util.Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(9L)).thenReturn(java.util.Optional.of(member));
        when(membershipRepository.findByUserIdOrderByEndDateDesc(9L)).thenReturn(List.of(membership));
        org.mockito.Mockito.doThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.CONFLICT, "No valid booking"))
                .when(checkInService).checkInBooking(9L, null);
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> controller.recordCheckIn(new com.sporthub.backend.dto.ReceptionistCheckInRequest(9L), receptionist));
        org.mockito.Mockito.verify(checkInRepository, org.mockito.Mockito.never()).save(any());
    }

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
        bookingPayment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
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

    @Test
    void getMyProfileReturnsReceptionistProfileAndStats() {
        User staff = User.builder()
                .userId(3L)
                .fullName("Phạm Minh Tú")
                .email("tu.receptionist@sporthub.vn")
                .phone("0912345678")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();
        lenient().when(userRepository.findById(3L)).thenReturn(java.util.Optional.of(staff));
        lenient().when(userRepository.findByIdForUpdate(3L)).thenReturn(java.util.Optional.of(staff));
        when(checkInRepository.countByRecordedBy(3L)).thenReturn(42L);

        var res = controller.getMyProfile(receptionist);

        assertEquals("Phạm Minh Tú", res.fullName());
        assertEquals("F-STAFF-003", res.staffCode());
        assertEquals("Nhân viên Lễ tân", res.roleTitle());
        assertEquals(42L, res.shiftStats().totalCheckInsHandled());
    }

    @Test
    void updateMyProfileUpdatesDetails() {
        User staff = User.builder()
                .userId(3L)
                .fullName("Phạm Minh Tú")
                .email("tu.receptionist@sporthub.vn")
                .phone("0912345678")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();
        lenient().when(userRepository.findById(3L)).thenReturn(java.util.Optional.of(staff));
        lenient().when(userRepository.findByIdForUpdate(3L)).thenReturn(java.util.Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        var req = new com.sporthub.backend.dto.ReceptionistProfileUpdateRequest(
                "Phạm Minh Tú Updated",
                "0988888888",
                LocalDate.of(1995, 1, 1),
                "Nam",
                "Quận 1, TP. HCM",
                "Người thân",
                "0999999999"
        );
        var res = controller.updateMyProfile(req, receptionist);

        assertEquals("Phạm Minh Tú Updated", res.fullName());
        assertEquals("0988888888", res.phone());
        assertEquals("Quận 1, TP. HCM", res.address());
    }

    @Test
    void updateMyAvatarSetsAvatar() {
        User staff = User.builder()
                .userId(3L)
                .fullName("Phạm Minh Tú")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();
        lenient().when(userRepository.findById(3L)).thenReturn(java.util.Optional.of(staff));
        lenient().when(userRepository.findByIdForUpdate(3L)).thenReturn(java.util.Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        var res = controller.updateMyAvatar(new ReceptionistController.AvatarUpdateRequest("data:image/jpeg;base64,newavatar"), receptionist);
        assertEquals(true, res.get("ok"));
        assertEquals("data:image/jpeg;base64,newavatar", res.get("avatar"));
    }
}
