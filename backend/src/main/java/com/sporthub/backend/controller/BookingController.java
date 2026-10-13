package com.sporthub.backend.controller;

import com.sporthub.backend.dto.ClassSessionResponse;
import com.sporthub.backend.dto.RosterBookingResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ClassSessionResponse>> getUpcomingClasses(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getUpcomingClasses(
                actorId(authentication), actorRole(authentication)));
    }

    @GetMapping("/my-schedule")
    public ResponseEntity<List<Booking>> getMySchedule(Authentication authentication) {
        requireRole(authentication, "MEMBER");
        return ResponseEntity.ok(bookingService.getMemberSchedule(actorId(authentication)));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {
        requireRole(authentication, "MEMBER");
        return ResponseEntity.ok(bookingService.cancelClassBooking(bookingId, actorId(authentication)));
    }

    @GetMapping("/classes/{sessionId}/roster")
    public ResponseEntity<List<RosterBookingResponse>> getSessionRoster(
            @PathVariable Long sessionId,
            Authentication authentication) {
        String role = actorRole(authentication);
        requireAnyRole(role, "COACH", "RECEPTIONIST", "MANAGER", "ADMIN");
        return ResponseEntity.ok(bookingService.getSessionRoster(sessionId, actorId(authentication), role));
    }

    @PutMapping("/{bookingId}/attendance")
    public ResponseEntity<Booking> updateAttendance(
            @PathVariable Long bookingId,
            @RequestParam String status,
            @RequestParam(required = false) String coachNote,
            Authentication authentication) {
        String role = actorRole(authentication);
        requireAnyRole(role, "COACH", "RECEPTIONIST", "MANAGER", "ADMIN");
        return ResponseEntity.ok(bookingService.updateAttendance(
                bookingId, actorId(authentication), role, status, coachNote));
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String actorRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .findFirst()
                .orElse("");
    }

    private void requireRole(Authentication authentication, String expectedRole) {
        requireAnyRole(actorRole(authentication), expectedRole);
    }

    private void requireAnyRole(String role, String... allowedRoles) {
        for (String allowedRole : allowedRoles) {
            if (allowedRole.equals(role)) {
                return;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN, "Vai trò tài khoản không được phép thực hiện thao tác này.");
    }
}
