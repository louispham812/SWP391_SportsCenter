package com.sporthub.backend.controller;

import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.AuditLogService;
import com.sporthub.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ManagerControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final MembershipPackageRepository packageRepository = mock(MembershipPackageRepository.class);
    private final PublicSportRepository sportRepository = mock(PublicSportRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final EmailService emailService = mock(EmailService.class);
    private final AuditLogService auditLogService = mock(AuditLogService.class);
    private final com.sporthub.backend.service.AuthService authService = mock(com.sporthub.backend.service.AuthService.class);
    private final com.sporthub.backend.service.MembershipService membershipService = mock(com.sporthub.backend.service.MembershipService.class);
    private final ManagerController controller =
            new ManagerController(userRepository, packageRepository, sportRepository, passwordEncoder, emailService, auditLogService, authService, membershipService);
    private final UsernamePasswordAuthenticationToken manager =
            new UsernamePasswordAuthenticationToken(
                    "1", "", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
    private final UsernamePasswordAuthenticationToken coach =
            new UsernamePasswordAuthenticationToken(
                    "2", "", List.of(new SimpleGrantedAuthority("ROLE_COACH")));

    @Test
    void pendingRegistrationListIsRestrictedToManagers() {
        assertThrows(ResponseStatusException.class, () -> controller.getPendingRegistrations(coach));

        controller.getPendingRegistrations(manager);

        verify(userRepository).findPendingStaffRegistrations(List.of("COACH", "RECEPTIONIST"));
    }

    @Test
    void managerCanSearchDatabaseUsersByRoleAndQuery() {
        User coachUser = pendingUser("COACH");
        when(userRepository.searchManagerUsers(eq("Nguyen"), eq("COACH"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(coachUser), PageRequest.of(0, 12), 1));

        var result = controller.searchUsers(" Nguyen ", " coach ", 0, 12, manager);

        assertEquals(1, result.getTotalElements());
        assertEquals("COACH", result.getContent().get(0).role());
        verify(userRepository).searchManagerUsers(eq("Nguyen"), eq("COACH"), any(PageRequest.class));
    }

    @Test
    void userSearchRejectsInvalidRolesAndNonManagers() {
        assertThrows(ResponseStatusException.class,
                () -> controller.searchUsers("", "OWNER", 0, 12, manager));
        assertThrows(ResponseStatusException.class,
                () -> controller.searchUsers("", null, 0, 12, coach));
    }

    @Test
    void managerCanSearchMembersByStatus() {
        User member = User.builder()
                .userId(12L)
                .fullName("Nguyen Member")
                .email("member@example.com")
                .role("MEMBER")
                .status("ACTIVE")
                .build();
        when(userRepository.searchManagerMembers(eq("Nguyen"), eq("ACTIVE"), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(member), PageRequest.of(0, 12), 1));

        var result = controller.searchMembers(" Nguyen ", " active ", 0, 12, manager);

        assertEquals(1, result.getTotalElements());
        assertEquals(12L, result.getContent().get(0).userId());
        verify(userRepository).searchManagerMembers(eq("Nguyen"), eq("ACTIVE"), any(PageRequest.class));
    }

    @Test
    void memberStatusChangesAreRestrictedToManagersAndMemberAccounts() {
        User member = User.builder()
                .userId(12L)
                .fullName("Nguyen Member")
                .email("member@example.com")
                .role("MEMBER")
                .status("ACTIVE")
                .build();
        when(userRepository.findById(12L)).thenReturn(Optional.of(member));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = controller.lockMember(12L, manager);

        assertEquals("LOCKED", result.status());
        assertThrows(ResponseStatusException.class, () -> controller.unlockMember(12L, coach));
        assertThrows(ResponseStatusException.class, () -> controller.lockMember(12L, manager));
    }

    @Test
    void managerCannotLockCoachAsMember() {
        User coachUser = pendingUser("COACH");
        coachUser.setStatus("ACTIVE");
        when(userRepository.findById(7L)).thenReturn(Optional.of(coachUser));

        assertThrows(ResponseStatusException.class, () -> controller.lockMember(7L, manager));
    }

    @Test
    void managerCanCreateBronzeForTheDemo() {
        when(packageRepository.save(any(MembershipPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var request = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Hạng Đồng", null, new BigDecimal("400000"), 30, "OFF_PEAK", "Demo", "ACTIVE", 5, 2,
                com.sporthub.backend.enums.MembershipTier.BRONZE);
        var created = controller.createPackage(request, manager);
        assertEquals("Hạng Đồng", created.getName());
        assertEquals("BRONZE", created.getMembershipTier());
        assertEquals(5, created.getQuotaSessions());
        assertEquals(2, created.getQuotaCourts());
    }

    @Test
    void managerCanCreateCustomTierNameAndRejectsDuplicateActiveTierOrName() {
        when(packageRepository.save(any(MembershipPackage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var customRequest = new com.sporthub.backend.dto.ManagerPackageRequest(
                "  Hạng Bạch Kim  ", null, new BigDecimal("3500000"), 30, "ALL_DAY", "Custom tier", "ACTIVE", 25, 12,
                "PLATINUM");
        var customCreated = controller.createPackage(customRequest, manager);
        assertEquals("Hạng Bạch Kim", customCreated.getName());
        assertEquals("PLATINUM", customCreated.getMembershipTier());
        assertEquals(com.sporthub.backend.enums.PackageType.VIP, customCreated.getPackageType());
        assertEquals(25, customCreated.getQuotaSessions());
        assertEquals(12, customCreated.getQuotaCourts());

        var untieredRequest = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gói Titan Đặc Biệt", null, new BigDecimal("4200000"), 30, "ALL_DAY", "No preset enum", "ACTIVE", 30, 15);
        var untieredCreated = controller.createPackage(untieredRequest, manager);
        assertEquals("Gói Titan Đặc Biệt", untieredCreated.getName());
        assertNull(untieredCreated.getMembershipTier());

        var silverRequest = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Hạng Bạc", null, new BigDecimal("800000"), 30, "OFF_PEAK", "", "ACTIVE", 10, 5,
                com.sporthub.backend.enums.MembershipTier.SILVER);
        when(packageRepository.existsByMembershipTierIgnoreCaseAndStatusAndPackageIdNot(
                "SILVER", "ACTIVE", -1L)).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> controller.createPackage(silverRequest, manager)).getStatusCode().value());

        when(packageRepository.existsByNameIgnoreCaseAndStatusAndPackageIdNot(
                "Hạng Bạch Kim", "ACTIVE", -1L)).thenReturn(true);
        assertEquals(409, assertThrows(ResponseStatusException.class,
                () -> controller.createPackage(customRequest, manager)).getStatusCode().value());
    }

    @Test
    void managerCanCreateAndUpdateDatabasePackage() {
        when(packageRepository.save(any(MembershipPackage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        var request = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness", null, new BigDecimal("2500000"), 90,
                "ALL_DAY", "Gym membership", "ACTIVE", 12, 6, com.sporthub.backend.enums.MembershipTier.GOLD);

        var created = controller.createPackage(request, manager);

        assertEquals("Gold Fitness", created.getName());
        assertEquals(new BigDecimal("2500000"), created.getPrice());
        assertEquals(90, created.getDurationDays());
        assertEquals(12, created.getQuotaSessions());
        assertEquals(6, created.getQuotaCourts());

        created.setPackageId(4L);
        when(packageRepository.findById(4L)).thenReturn(Optional.of(created));
        var update = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness Plus", null, new BigDecimal("3000000"), 120,
                "PEAK", "Updated", "ACTIVE", 20, 8);
        var updated = controller.updatePackage(4L, update, manager);

        assertEquals("Gold Fitness Plus", updated.getName());
        assertEquals("PEAK", updated.getAccessType());
        assertEquals(20, updated.getQuotaSessions());
        assertEquals(8, updated.getQuotaCourts());

        // Null quotas on legacy update keep existing quota values; zero explicitly resets to 0
        var legacyUpdate = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness Legacy", null, new BigDecimal("3000000"), 120,
                "PEAK", "Updated", "ACTIVE");
        var legacyUpdated = controller.updatePackage(4L, legacyUpdate, manager);
        assertEquals("Gold Fitness Legacy", legacyUpdated.getName());
        assertEquals(20, legacyUpdated.getQuotaSessions());
        assertEquals(8, legacyUpdated.getQuotaCourts());

        var resetZeroUpdate = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness Zero", null, new BigDecimal("3000000"), 120,
                "PEAK", "Updated", "ACTIVE", 0, 0);
        var resetUpdated = controller.updatePackage(4L, resetZeroUpdate, manager);
        assertEquals("Gold Fitness Zero", resetUpdated.getName());
        assertEquals(0, resetUpdated.getQuotaSessions());
        assertEquals(0, resetUpdated.getQuotaCourts());
    }

    @Test
    void packageManagementIsManagerOnlyAndValidatesPackageFields() {
        assertThrows(ResponseStatusException.class, () -> controller.getPackages(coach));
        assertThrows(ResponseStatusException.class, () -> controller.createPackage(
                new com.sporthub.backend.dto.ManagerPackageRequest(
                        "", null, new BigDecimal("100"), 30, "ALL_DAY", "", "ACTIVE"),
                manager));
        assertThrows(ResponseStatusException.class, () -> controller.createPackage(
                new com.sporthub.backend.dto.ManagerPackageRequest(
                        "A".repeat(101), null, new BigDecimal("100"), 30, "ALL_DAY", "", "ACTIVE"),
                manager));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> controller.createPackage(
                new com.sporthub.backend.dto.ManagerPackageRequest(
                        "Invalid Session Quota", null, new BigDecimal("100"), 30,
                        "ALL_DAY", "", "ACTIVE", -1, 0),
                manager)).getStatusCode().value());
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> controller.createPackage(
                new com.sporthub.backend.dto.ManagerPackageRequest(
                        "Invalid Court Quota", null, new BigDecimal("100"), 30,
                        "ALL_DAY", "", "ACTIVE", 0, -2),
                manager)).getStatusCode().value());
        assertThrows(ResponseStatusException.class, () -> controller.updatePackageStatus(
                1L, new ManagerController.PackageStatusRequest("DELETED"), manager));
    }

    @Test
    void pendingMembershipsExposeQuotaCourtsAsQuotaCourtHours() {
        UserMembershipRepository userMembershipRepository = mock(UserMembershipRepository.class);
        ReflectionTestUtils.setField(controller, "userMembershipRepository", userMembershipRepository);

        UserMembership pending = new UserMembership();
        pending.setMembershipId(11L);
        pending.setUserId(22L);
        pending.setPackageId(33L);
        pending.setStatus("PENDING_APPROVAL");
        pending.setStartDate(LocalDate.of(2026, 11, 19));

        User member = User.builder()
                .userId(22L)
                .fullName("Hội Viên A")
                .email("member.a@example.com")
                .phone("0901234567")
                .role("MEMBER")
                .status("ACTIVE")
                .build();

        MembershipPackage pkg = MembershipPackage.builder()
                .packageId(33L)
                .name("Gói VIP Sân & Lớp")
                .accessType("ALL_DAY")
                .price(new BigDecimal("1500000"))
                .durationDays(30)
                .quotaSessions(12)
                .quotaCourts(5)
                .build();

        when(userMembershipRepository.findAll()).thenReturn(List.of(pending));
        when(userRepository.findById(22L)).thenReturn(Optional.of(member));
        when(packageRepository.findById(33L)).thenReturn(Optional.of(pkg));

        var rows = controller.getPendingMemberships(manager);

        assertEquals(1, rows.size());
        assertEquals(5, rows.getFirst().get("quotaCourtHours"));
        assertEquals(12, rows.getFirst().get("quotaClassSessions"));
    }

    @Test
    void managerCanApprovePendingCoach() {
        User pending = pendingUser("COACH");
        pending.setSpecialty("Bơi lội, Yoga");
        when(userRepository.findPendingStaffRegistrations(List.of("COACH", "RECEPTIONIST")))
                .thenReturn(List.of(pending));
        when(userRepository.findById(7L)).thenReturn(Optional.of(pending));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var pendingList = controller.getPendingRegistrations(manager);
        assertEquals(1, pendingList.size());
        assertEquals("Bơi lội, Yoga", pendingList.get(0).specialty());

        var result = controller.approveRegistration(7L, manager);

        assertEquals("ACTIVE", pending.getStatus());
        assertEquals("COACH", result.role());
        assertEquals("Bơi lội, Yoga", result.specialty());
        verify(userRepository).save(pending);
    }

    @Test
    void managerCanRejectPendingReceptionist() {
        User pending = pendingUser("RECEPTIONIST");
        when(userRepository.findById(8L)).thenReturn(Optional.of(pending));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.rejectRegistration(8L, manager);

        assertEquals("INACTIVE", pending.getStatus());
        verify(userRepository).save(pending);
    }

    @Test
    void cannotProcessRegistrationMoreThanOnce() {
        User approved = pendingUser("COACH");
        approved.setStatus("ACTIVE");
        when(userRepository.findById(7L)).thenReturn(Optional.of(approved));

        assertThrows(ResponseStatusException.class, () -> controller.approveRegistration(7L, manager));
    }

    @Test
    void managerCanCreateAnyRoleUser() {
        var adminAuth = new UsernamePasswordAuthenticationToken(
                "10", "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(99L);
            return u;
        });

        for (String role : List.of("MEMBER", "COACH", "RECEPTIONIST", "MANAGER", "ADMIN")) {
            String email = role.toLowerCase() + ".new@example.com";
            when(authService.findUserByEmail(email)).thenReturn(Optional.empty());
            var req = new com.sporthub.backend.dto.CreateUserRequest(
                    "User " + role, email, "0911222333", "SportHub@123", role.toLowerCase());

            var actor = "ADMIN".equals(role) ? adminAuth : manager;
            var res = controller.createUser(req, actor);
            assertEquals("ADMIN".equals(role) ? "MANAGER" : role, res.role());
            assertEquals("ACTIVE", res.status());
        }

        var invalidReq = new com.sporthub.backend.dto.CreateUserRequest(
                "Invalid Role", "invalid@example.com", "0911222334", "SportHub@123", "OWNER");
        assertThrows(ResponseStatusException.class, () -> controller.createUser(invalidReq, manager));
    }

    @Test
    void receptionistCannotCreateManagerUser() {
        var receptionistAuth = new UsernamePasswordAuthenticationToken(
                "3", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));
        com.sporthub.backend.dto.CreateUserRequest request = new com.sporthub.backend.dto.CreateUserRequest(
                "Tạo Lén Manager", "stealth@example.com", "0911222444", "SportHub@123", "MANAGER");

        assertThrows(ResponseStatusException.class, () -> controller.createUser(request, receptionistAuth));
    }

    @Test
    void receptionistCannotCreateCoachUserButCanCreateMemberUser() {
        var receptionistAuth = new UsernamePasswordAuthenticationToken(
                "3", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));
        com.sporthub.backend.dto.CreateUserRequest coachRequest = new com.sporthub.backend.dto.CreateUserRequest(
                "HLV Mới Tuyển", "coach.new@example.com", "0911222555", "SportHub@123", "COACH");
        when(authService.findUserByEmail("coach.new@example.com")).thenReturn(Optional.empty());
        var forbiddenEx = assertThrows(ResponseStatusException.class,
                () -> controller.createUser(coachRequest, receptionistAuth));
        assertEquals(403, forbiddenEx.getStatusCode().value());

        com.sporthub.backend.dto.CreateUserRequest memberRequest = new com.sporthub.backend.dto.CreateUserRequest(
                "Hội Viên Mới", "member.new@example.com", "0911222556", "SportHub@123", "MEMBER");
        when(authService.findUserByEmail("member.new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(100L);
            return u;
        });

        var res = controller.createUser(memberRequest, receptionistAuth);
        assertEquals("MEMBER", res.role());
        assertEquals("ACTIVE", res.status());
    }

    @Test
    void managerCoachSportAssignmentNormalizesValidatesAndExposesSportIds() {
        SportRepository domainSportRepository = mock(SportRepository.class);
        Sport pickleball = new Sport();
        pickleball.setSportId(2L);
        pickleball.setSportName("Pickleball");
        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        when(domainSportRepository.findAllByOrderBySportIdAsc()).thenReturn(List.of(pickleball, tennis));
        when(domainSportRepository.findAllById(List.of(3L, 2L))).thenReturn(List.of(pickleball, tennis));
        when(domainSportRepository.findAllById(List.of(2L))).thenReturn(List.of(pickleball));
        ReflectionTestUtils.setField(controller, "domainSportRepository", domainSportRepository);

        when(authService.findUserByEmail("coach.sport@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u.getUserId() == null) u.setUserId(101L);
            return u;
        });

        // Creating COACH without sports is rejected when sports catalog is active
        var missingSportReq = new com.sporthub.backend.dto.CreateUserRequest(
                "HLV Thiếu Môn", "coach.nosport@example.com", "0911222666", "SportHub@123", "COACH");
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> controller.createUser(missingSportReq, manager)).getStatusCode().value());

        // Creating COACH with sportIds saves canonical comma-separated sport names & coachedSports relation
        var validCoachReq = new com.sporthub.backend.dto.CreateUserRequest(
                "HLV Đủ Môn", "coach.sport@example.com", "0911222777", "SportHub@123",
                "COACH", List.of(3L, 2L), null);
        var created = controller.createUser(validCoachReq, manager);
        assertEquals("Tennis, Pickleball", created.specialty());
        assertEquals(List.of(2L, 3L), created.sportIds());
        verify(userRepository).save(org.mockito.ArgumentMatchers.argThat(u ->
                u.getCoachedSports() != null
                        && u.getCoachedSports().stream().map(Sport::getSportId).collect(Collectors.toSet()).equals(Set.of(2L, 3L))));

        // Search prioritizes coachedSports relation when populated, and falls back when empty
        User existingCoach = User.builder()
                .userId(5L)
                .fullName("Trần Văn Minh")
                .email("coach.minh@sporthub.com")
                .role("COACH")
                .status("ACTIVE")
                .specialty("Tennis, Pickleball")
                .coachedSports(Set.of(pickleball, tennis))
                .build();
        when(userRepository.searchManagerUsers("", "COACH", PageRequest.of(0, 12)))
                .thenReturn(new PageImpl<>(List.of(existingCoach)));
        var searchRes = controller.searchUsers("", "COACH", 0, 12, manager);
        assertEquals("Tennis, Pickleball", searchRes.getContent().getFirst().specialty());
        assertEquals(List.of(2L, 3L), searchRes.getContent().getFirst().sportIds());

        // Update coach assigned sports updates both specialty and coachedSports
        when(userRepository.findById(5L)).thenReturn(Optional.of(existingCoach));
        var updated = controller.updateCoachSports(
                5L, new ManagerController.UpdateCoachSportsRequest(List.of(2L), null), manager);
        assertEquals("Pickleball", updated.specialty());
        assertEquals(List.of(2L), updated.sportIds());
        // Approve COACH requires sportIds/specialty when coach has no assigned sports
        User newlyRegisteredCoach = pendingUser("COACH");
        newlyRegisteredCoach.setUserId(15L);
        when(userRepository.findById(15L)).thenReturn(Optional.of(newlyRegisteredCoach));
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> controller.approveRegistration(15L, null, manager)).getStatusCode().value());

        var approvedCoach = controller.approveRegistration(
                15L, new ManagerController.UpdateCoachSportsRequest(List.of(3L, 2L), null), manager);
        assertEquals("ACTIVE", newlyRegisteredCoach.getStatus());
        assertEquals("Tennis, Pickleball", approvedCoach.specialty());
        assertEquals(Set.of(2L, 3L),
                newlyRegisteredCoach.getCoachedSports().stream().map(Sport::getSportId).collect(Collectors.toSet()));
    }

    private User pendingUser(String role) {
        return User.builder()
                .userId(7L)
                .fullName("Nguyen Van A")
                .email("staff@example.com")
                .phone("0900000000")
                .role(role)
                .status("PENDING")
                .build();
    }
}
