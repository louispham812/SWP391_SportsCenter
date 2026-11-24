package com.sporthub.backend.service;

import static org.mockito.Mockito.lenient;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MembershipServiceTest {
    @Test
    void onlyRenewingTheSameTierQueuesTheNewTerm() {
        for (var oldTier : new String[] { null, "SILVER", "GOLD" }) {
            var rows = mock(UserMembershipRepository.class);
            var catalog = mock(MembershipPackageRepository.class);
            var payments = mock(PaymentTransactionRepository.class);
            var tierService = new MembershipService(rows, catalog, null, null, null);
            org.springframework.test.util.ReflectionTestUtils.setField(tierService, "payments", payments);
            var old = new UserMembership();
            old.setMembershipId(1L); old.setUserId(9L); old.setPackageId(1L);
            old.setEndDate(java.time.LocalDate.now().plusDays(20));
            var purchased = new UserMembership();
            purchased.setMembershipId(55L); purchased.setUserId(9L); purchased.setPackageId(8L); purchased.setStatus("PENDING_APPROVAL");
            var paid = new PaymentTransaction(); paid.setMemberId(9L); paid.setPaymentStatus("PAID");
            when(payments.findFirstByMembershipIdOrderByCreatedAtDesc(55L)).thenReturn(Optional.of(paid));
            when(rows.findByIdForUpdate(55L)).thenReturn(Optional.of(purchased));
            when(rows.findByUserIdAndStatus(9L, "ACTIVE")).thenReturn(java.util.List.of(old));
            when(catalog.findById(1L)).thenReturn(Optional.of(MembershipPackage.builder().membershipTier(oldTier).build()));
            when(catalog.findById(8L)).thenReturn(Optional.of(MembershipPackage.builder()
                    .membershipTier("GOLD").durationDays(30).quotaSessions(20).quotaCourts(10).build()));
            tierService.approveMembership(55L, 1L);
            assertEquals("GOLD".equals(oldTier)
                    ? old.getEndDate().plusDays(1) : java.time.LocalDate.now(), purchased.getStartDate());
            assertEquals(purchased.getStartDate().plusDays(29), purchased.getEndDate());
        }
    }
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

    @Test
    void customNamedPackageEnforcesAccessWindowAndOnlyStacksSamePackageId() {
        var rows = mock(UserMembershipRepository.class);
        var catalog = mock(MembershipPackageRepository.class);
        var payments = mock(PaymentTransactionRepository.class);
        var tierService = new MembershipService(rows, catalog, null, null, null);
        org.springframework.test.util.ReflectionTestUtils.setField(tierService, "payments", payments);

        var activeCustom = new UserMembership();
        activeCustom.setMembershipId(1L);
        activeCustom.setUserId(9L);
        activeCustom.setPackageId(10L);
        activeCustom.setStatus("ACTIVE");
        activeCustom.setStartDate(java.time.LocalDate.now().minusDays(1));
        activeCustom.setEndDate(java.time.LocalDate.now().plusDays(20));

        var offPeakCustom = MembershipPackage.builder()
                .packageId(10L).name("Hạng Bạch Kim").accessType("OFF_PEAK").durationDays(30).build();
        var anotherCustom = MembershipPackage.builder()
                .packageId(11L).name("Hạng Titan").accessType("ALL_DAY").durationDays(30).build();

        when(rows.findById(1L)).thenReturn(Optional.of(activeCustom));
        when(catalog.findById(10L)).thenReturn(Optional.of(offPeakCustom));
        when(catalog.findById(11L)).thenReturn(Optional.of(anotherCustom));

        var evening = java.time.LocalDate.now().atTime(18, 0);
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> tierService.requireBookingAccess(1L, evening, evening.plusHours(1)));
        var morning = java.time.LocalDate.now().atTime(9, 0);
        assertDoesNotThrow(() -> tierService.requireBookingAccess(1L, morning, morning.plusHours(1)));

        var purchased = new UserMembership();
        purchased.setMembershipId(55L);
        purchased.setUserId(9L);
        purchased.setPackageId(11L);
        purchased.setStatus("PENDING_APPROVAL");
        var paid = new PaymentTransaction();
        paid.setMemberId(9L);
        paid.setPaymentStatus("PAID");
        when(payments.findFirstByMembershipIdOrderByCreatedAtDesc(55L)).thenReturn(Optional.of(paid));
        when(rows.findByIdForUpdate(55L)).thenReturn(Optional.of(purchased));
        when(rows.findByUserIdAndStatus(9L, "ACTIVE")).thenReturn(java.util.List.of(activeCustom));

        tierService.approveMembership(55L, 1L);
        assertEquals(java.time.LocalDate.now(), purchased.getStartDate());
    }
}
