package com.sporthub.backend.service;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock
    private RefundRequestRepository refundRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MembershipPackageRepository membershipPackageRepository;

    @Mock
    private EngagementService engagementService;

    private RefundService refundService;

    @BeforeEach
    void setUp() {
        refundService = new RefundService(
                refundRequestRepository,
                userRepository,
                membershipPackageRepository,
                engagementService
        );
    }

    @Test
    void createAutoApprovedRefund_Success() {
        // Given
        Long memberId = 100L;
        BigDecimal amount = new BigDecimal("500000");
        String reason = "Test refund reason";
        Long managerId = 1L;

        User user = User.builder()
                .userId(memberId)
                .fullName("Nguyen Van A")
                .email("a@example.com")
                .phone("0912345678")
                .build();

        when(userRepository.findById(memberId)).thenReturn(Optional.of(user));
        when(refundRequestRepository.save(any(RefundRequest.class))).thenAnswer(i -> i.getArgument(0));

        // When
        RefundRequest result = refundService.createAutoApprovedRefund(
                memberId, amount, reason, managerId, null, "REF-001"
        );

        // Then
        assertNotNull(result);
        assertEquals("APPROVED", result.getStatus());
        assertEquals(amount, result.getRefundAmount());
        assertEquals(reason, result.getReason());
        assertEquals(managerId, result.getApprovedBy());
        assertEquals("Nguyen Van A", result.getMemberName());

        verify(refundRequestRepository, times(1)).save(any(RefundRequest.class));
        verify(engagementService, times(1)).notifyUser(
                eq(memberId),
                eq("Yêu cầu hoàn tiền đã được duyệt"),
                anyString(),
                eq("REFUND")
        );
    }

    @Test
    void createAutoApprovedRefund_InvalidAmount_ThrowsException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            refundService.createAutoApprovedRefund(
                    100L, BigDecimal.ZERO, "Reason", 1L, null, null
            );
        });

        assertThrows(IllegalArgumentException.class, () -> {
            refundService.createAutoApprovedRefund(
                    100L, new BigDecimal("-100"), "Reason", 1L, null, null
            );
        });

        verify(refundRequestRepository, never()).save(any());
    }

    @Test
    void createRefundForRejectedMembership_Success() {
        // Given
        Long memberId = 100L;
        Long packageId = 50L;
        Long membershipId = 200L;
        Long managerId = 1L;
        String rejectReason = "Invalid payment proof";

        User user = User.builder()
                .userId(memberId)
                .fullName("Nguyen Van B")
                .email("b@example.com")
                .phone("0987654321")
                .build();

        MembershipPackage pkg = new MembershipPackage();
        pkg.setPackageId(packageId);
        pkg.setName("Gói VIP 3 Tháng");
        pkg.setPrice(new BigDecimal("3000000"));

        UserMembership membership = new UserMembership();
        membership.setMembershipId(membershipId);
        membership.setUserId(memberId);
        membership.setPackageId(packageId);

        when(userRepository.findById(memberId)).thenReturn(Optional.of(user));
        when(membershipPackageRepository.findById(packageId)).thenReturn(Optional.of(pkg));
        when(refundRequestRepository.save(any(RefundRequest.class))).thenAnswer(i -> i.getArgument(0));

        // When
        RefundRequest result = refundService.createRefundForRejectedMembership(
                membership, rejectReason, managerId
        );

        // Then
        assertNotNull(result);
        assertEquals("APPROVED", result.getStatus());
        assertEquals(pkg.getPrice(), result.getRefundAmount());
        assertTrue(result.getReason().contains("Gói VIP 3 Tháng"));
        assertTrue(result.getReason().contains(rejectReason));
        assertEquals(managerId, result.getApprovedBy());

        // Verify notification sent
        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, times(1)).notifyUser(
                eq(memberId),
                anyString(),
                messageCaptor.capture(),
                eq("REFUND")
        );

        String notificationMessage = messageCaptor.getValue();
        assertTrue(notificationMessage.contains("3-5 ngày làm việc"));
    }

    @Test
    void createAutoApprovedRefund_NullMemberId_ThrowsException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            refundService.createAutoApprovedRefund(
                    null, new BigDecimal("100000"), "Reason", 1L, null, null
            );
        });
    }

    @Test
    void createAutoApprovedRefund_EmptyReason_ThrowsException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            refundService.createAutoApprovedRefund(
                    100L, new BigDecimal("100000"), "", 1L, null, null
            );
        });

        assertThrows(IllegalArgumentException.class, () -> {
            refundService.createAutoApprovedRefund(
                    100L, new BigDecimal("100000"), "   ", 1L, null, null
            );
        });
    }
}
