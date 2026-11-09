package com.sporthub.backend.service;

import static org.mockito.Mockito.lenient;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MembershipServiceTest {
    private final UserMembershipRepository memberships = mock(UserMembershipRepository.class);
    private final MembershipPackageRepository packages = mock(MembershipPackageRepository.class);
    private final MembershipService service = new MembershipService(memberships, packages, null, null, null);

    @Test
    void approvalGrantsConfiguredCourtQuotaAndCannotGrantTwice() {
        UserMembership m = new UserMembership();
        m.setMembershipId(55L); m.setUserId(9L);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "payments", payments);
        PaymentTransaction paid = new PaymentTransaction(); paid.setMemberId(9L); paid.setPaymentStatus("PAID");
        when(payments.findFirstByMembershipIdOrderByCreatedAtDesc(55L)).thenReturn(Optional.of(paid));
        m.setPackageId(2L);
        m.setStatus("PENDING_APPROVAL");
        lenient().when(memberships.findById(55L)).thenReturn(Optional.of(m));
        lenient().when(memberships.findByIdForUpdate(55L)).thenReturn(Optional.of(m));
        when(packages.findById(2L)).thenReturn(Optional.of(MembershipPackage.builder()
                .durationDays(30).quotaSessions(5).quotaCourts(10).build()));
        service.approveMembership(55L, 3L);
        assertEquals("ACTIVE", m.getStatus());
        assertEquals(10, m.getInitialQuotaCourts());
        assertEquals(10, m.getRemainingQuotaCourts());
        assertEquals(0, m.getHeldQuotaCourts());
        assertEquals(0, m.getUsedQuotaCourts());
        service.validateCourtQuotaFormula(m);
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.approveMembership(55L, 3L));
        verify(memberships, times(1)).save(m);
    }

    @Test
    void releasingFractionalCourtHoursRestoresRoundedHoldWithoutChangingClassQuota() {
        UserMembership m = new UserMembership();
        m.setStatus("ACTIVE"); m.setStartDate(java.time.LocalDate.now().minusDays(1)); m.setEndDate(java.time.LocalDate.now().plusDays(1));
        m.setInitialQuotaCourts(10);
        m.setRemainingQuotaCourts(8);
        m.setHeldQuotaCourts(2);
        m.setRemainingQuotaSessions(7);
        lenient().when(memberships.findById(55L)).thenReturn(Optional.of(m));
        lenient().when(memberships.findByIdForUpdate(55L)).thenReturn(Optional.of(m));
        service.releaseCourtQuota(55L, 1.5);
        assertEquals(10, m.getRemainingQuotaCourts());
        assertEquals(0, m.getHeldQuotaCourts());
        assertEquals(7, m.getRemainingQuotaSessions());
        service.validateCourtQuotaFormula(m);
    }
}
