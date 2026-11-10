package com.sporthub.backend.workflow;

import static org.mockito.Mockito.lenient;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.service.MembershipService;
import com.sporthub.backend.service.RefundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Integration test cho workflow:
 * Member mua gói → Manager reject → Auto refund 100%
 */
@ExtendWith(MockitoExtension.class)
class MembershipRefundWorkflowTest {

    @Mock
    private UserMembershipRepository membershipRepository;

    @Mock
    private MembershipPackageRepository packageRepository;

    @Mock
    private RefundRequestRepository refundRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EngagementService engagementService;

    private MembershipService membershipService;
    private RefundService refundService;

    @BeforeEach
    void setUp() {
        refundService = new RefundService(
                refundRepository,
                userRepository,
                packageRepository,
                engagementService
        );

        membershipService = new MembershipService(
                membershipRepository,
                packageRepository,
                refundService,
                engagementService,
                null  // auditLogService not needed for this test
        );
        var payments = mock(com.sporthub.backend.repository.PaymentTransactionRepository.class);
        org.springframework.test.util.ReflectionTestUtils.setField(membershipService, "payments", payments);
        org.springframework.test.util.ReflectionTestUtils.setField(refundService, "payments", payments);
        when(payments.findFirstByMembershipIdOrderByCreatedAtDesc(anyLong())).thenAnswer(i -> {
            var membership = membershipRepository.findById(i.getArgument(0)).orElseThrow();
            var payment = new com.sporthub.backend.entity.PaymentTransaction();
            payment.setPaymentId(555L); payment.setMemberId(membership.getUserId()); payment.setPaymentStatus("PAID");
            payment.setAmount(packageRepository.findById(membership.getPackageId()).orElseThrow().getPrice());
            return Optional.of(payment);
        });
    }

    @Test
    void testRejectMembership_CreatesAutoApprovedRefund() {
        // Given
        Long membershipId = 100L;
        Long userId = 50L;
        Long packageId = 10L;
        Long managerId = 1L;
        String rejectReason = "Thông tin thanh toán không khớp với hệ thống";

        // Setup membership
        UserMembership membership = new UserMembership();
        membership.setMembershipId(membershipId);
        membership.setUserId(userId);
        membership.setPackageId(packageId);
        membership.setStatus("PENDING_APPROVAL");

        // Setup package
        MembershipPackage pkg = new MembershipPackage();
        pkg.setPackageId(packageId);
        pkg.setName("Gói VIP 3 Tháng Toàn Diện");
        pkg.setPrice(new BigDecimal("4500000"));
        pkg.setDurationDays(90);

        // Setup user
        com.sporthub.backend.entity.User user = com.sporthub.backend.entity.User.builder()
                .userId(userId)
                .fullName("Lê Hoàng Long")
                .email("long@example.com")
                .phone("0988123456")
                .build();

        lenient().when(membershipRepository.findById(membershipId)).thenReturn(Optional.of(membership));

        lenient().when(membershipRepository.findByIdForUpdate(membershipId)).thenReturn(Optional.of(membership));
        when(packageRepository.findById(packageId)).thenReturn(Optional.of(pkg));
        lenient().when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        lenient().when(userRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
        when(refundRepository.save(any(RefundRequest.class))).thenAnswer(i -> {
            RefundRequest saved = i.getArgument(0);
            saved.setRefundId(999L);  // Simulate auto-generated ID
            return saved;
        });

        // When
        membershipService.rejectMembership(membershipId, rejectReason, managerId);

        // Then
        // 1. Verify membership status updated to REJECTED
        assertEquals("REJECTED", membership.getStatus());
        verify(membershipRepository, times(1)).save(membership);

        // 2. Verify refund request created with auto-approval
        verify(refundRepository, times(2)).save(any(RefundRequest.class));

        // Capture the refund request
        var refundCaptor = org.mockito.ArgumentCaptor.forClass(RefundRequest.class);
        verify(refundRepository, times(2)).save(refundCaptor.capture());
        RefundRequest capturedRefund = refundCaptor.getValue();

        assertNotNull(capturedRefund);
        assertEquals("PENDING_APPROVAL", capturedRefund.getStatus(), "Refund should be auto-approved");
        assertEquals(pkg.getPrice(), capturedRefund.getRefundAmount(), "Should refund 100% package price");
        assertEquals(userId, capturedRefund.getMemberId());
        assertEquals(managerId, capturedRefund.getApprovedBy());
        assertTrue(capturedRefund.getReason().contains("Gói VIP 3 Tháng Toàn Diện"));
        assertTrue(capturedRefund.getReason().contains(rejectReason));

        // 3. Verify notifications sent (2 calls: 1 for refund, 1 for membership rejection)
        verify(engagementService, times(2)).notifyUser(
                eq(userId),
                anyString(),
                anyString(),
                anyString()
        );
    }

    @Test
    void testApproveMembership_ActivatesSuccessfully() {
        // Given
        Long membershipId = 200L;
        Long userId = 60L;
        Long packageId = 20L;
        Long managerId = 1L;

        UserMembership membership = new UserMembership();
        membership.setMembershipId(membershipId);
        membership.setUserId(userId);
        membership.setPackageId(packageId);
        membership.setStatus("PENDING_APPROVAL");

        MembershipPackage pkg = new MembershipPackage();
        pkg.setPackageId(packageId);
        pkg.setName("Gói PT Cá Nhân 12 Buổi");
        pkg.setPrice(new BigDecimal("2400000"));
        pkg.setDurationDays(60);
        pkg.setQuotaSessions(12);

        lenient().when(membershipRepository.findById(membershipId)).thenReturn(Optional.of(membership));

        lenient().when(membershipRepository.findByIdForUpdate(membershipId)).thenReturn(Optional.of(membership));
        when(packageRepository.findById(packageId)).thenReturn(Optional.of(pkg));

        // When
        membershipService.approveMembership(membershipId, managerId);

        // Then
        assertEquals("ACTIVE", membership.getStatus());
        assertNotNull(membership.getStartDate());
        assertEquals(LocalDate.now().plusDays(59), membership.getEndDate());
        assertEquals(12, membership.getInitialQuotaSessions());
        assertEquals(12, membership.getRemainingQuotaSessions());
        assertEquals(0, membership.getHeldQuotaSessions());
        assertEquals(0, membership.getUsedQuotaSessions());

        verify(membershipRepository, times(1)).save(membership);
        verify(engagementService, times(1)).notifyUser(
                eq(userId),
                anyString(),
                anyString(),
                eq("MEMBERSHIP")
        );

        // Should NOT create refund request when approving
        verify(refundRepository, never()).save(any());
    }
}
