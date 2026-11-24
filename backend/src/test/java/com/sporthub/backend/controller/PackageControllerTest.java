package com.sporthub.backend.controller;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.enums.PackageType;
import com.sporthub.backend.repository.MembershipPackageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PackageControllerTest {
    private final MembershipPackageRepository packageRepository = mock(MembershipPackageRepository.class);
    private final PackageController controller = new PackageController(packageRepository);
    private final UsernamePasswordAuthenticationToken admin = new UsernamePasswordAuthenticationToken(
            "1", "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    private final UsernamePasswordAuthenticationToken member = new UsernamePasswordAuthenticationToken(
            "2", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));

    @Test
    void adminCanCreateCustomNamedPackageAndValidatesInput() {
        when(packageRepository.save(any(MembershipPackage.class))).thenAnswer(i -> i.getArgument(0));
        MembershipPackage req = MembershipPackage.builder()
                .name("  Hạng Bạch Kim  ")
                .price(new BigDecimal("3500000"))
                .durationDays(30)
                .accessType("ALL_DAY")
                .quotaSessions(25)
                .quotaCourts(12)
                .build();

        MembershipPackage saved = controller.createPackage(req, admin).getBody();
        assertNotNull(saved);
        assertEquals("Hạng Bạch Kim", saved.getName());
        assertNull(saved.getMembershipTier());
        assertEquals(PackageType.VIP, saved.getPackageType());

        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> controller.createPackage(req, member)).getStatusCode().value());

        MembershipPackage blank = MembershipPackage.builder()
                .name("   ").price(new BigDecimal("100000")).durationDays(30).build();
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> controller.createPackage(blank, admin)).getStatusCode().value());

        when(packageRepository.existsByNameIgnoreCaseAndStatusAndPackageIdNot("Hạng Bạch Kim", "ACTIVE", -1L))
                .thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> controller.createPackage(req, admin)).getStatusCode().value());
    }
}
