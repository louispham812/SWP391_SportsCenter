package com.sporthub.backend.controller;

import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.AuditLogService;
import com.sporthub.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    void managerCanCreateAndUpdateDatabasePackage() {
        when(packageRepository.save(any(MembershipPackage.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        var request = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness", null, new BigDecimal("2500000"), 90,
                "ALL_DAY", "Gym membership", "ACTIVE");

        var created = controller.createPackage(request, manager);

        assertEquals("Gold Fitness", created.getName());
        assertEquals(new BigDecimal("2500000"), created.getPrice());
        assertEquals(90, created.getDurationDays());

        created.setPackageId(4L);
        when(packageRepository.findById(4L)).thenReturn(Optional.of(created));
        var update = new com.sporthub.backend.dto.ManagerPackageRequest(
                "Gold Fitness Plus", null, new BigDecimal("3000000"), 120,
                "PEAK", "Updated", "ACTIVE");
        var updated = controller.updatePackage(4L, update, manager);

        assertEquals("Gold Fitness Plus", updated.getName());
        assertEquals("PEAK", updated.getAccessType());
    }

    @Test
    void packageManagementIsManagerOnlyAndValidatesPackageFields() {
        assertThrows(ResponseStatusException.class, () -> controller.getPackages(coach));
        assertThrows(ResponseStatusException.class, () -> controller.createPackage(
                new com.sporthub.backend.dto.ManagerPackageRequest(
                        "", null, new BigDecimal("100"), 30, "ALL_DAY", "", "ACTIVE"),
                manager));
        assertThrows(ResponseStatusException.class, () -> controller.updatePackageStatus(
                1L, new ManagerController.PackageStatusRequest("DELETED"), manager));
    }

    @Test
    void managerCanApprovePendingCoach() {
        User pending = pendingUser("COACH");
        when(userRepository.findById(7L)).thenReturn(Optional.of(pending));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = controller.approveRegistration(7L, manager);

        assertEquals("ACTIVE", pending.getStatus());
        assertEquals("COACH", result.role());
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
        com.sporthub.backend.dto.CreateUserRequest request = new com.sporthub.backend.dto.CreateUserRequest(
                "Trần Quản Lý Mới", "manager.new@example.com", "0911222333", "SportHub@123", "MANAGER");
        when(userRepository.existsByEmailIgnoreCase("manager.new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(99L);
            return u;
        });

        var res = controller.createUser(request, manager);
        assertEquals("MANAGER", res.role());
        assertEquals("ACTIVE", res.status());
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
    void receptionistCanCreateCoachUser() {
        var receptionistAuth = new UsernamePasswordAuthenticationToken(
                "3", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));
        com.sporthub.backend.dto.CreateUserRequest request = new com.sporthub.backend.dto.CreateUserRequest(
                "HLV Mới Tuyển", "coach.new@example.com", "0911222555", "SportHub@123", "COACH");
        when(userRepository.existsByEmailIgnoreCase("coach.new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(100L);
            return u;
        });

        var res = controller.createUser(request, receptionistAuth);
        assertEquals("COACH", res.role());
        assertEquals("ACTIVE", res.status());
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
