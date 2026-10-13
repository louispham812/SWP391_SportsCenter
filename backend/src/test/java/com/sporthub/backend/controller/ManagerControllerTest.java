package com.sporthub.backend.controller;

import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ManagerControllerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final ManagerController controller = new ManagerController(userRepository);
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
