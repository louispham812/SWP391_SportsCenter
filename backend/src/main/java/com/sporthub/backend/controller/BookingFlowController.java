package com.sporthub.backend.controller;

import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.BookingQuoteResponse;
import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.dto.ClassSessionResponse;
import com.sporthub.backend.dto.CourtSlotResponse;
import com.sporthub.backend.dto.MemberScheduleEntryResponse;
import com.sporthub.backend.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/booking-flow")
@CrossOrigin(origins = "*")
public class BookingFlowController {

    private final BookingService bookingService;

    public BookingFlowController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/courts")
    public ResponseEntity<List<CourtSlotResponse>> getAvailableCourtSlots(@RequestParam Long sportId) {
        return ResponseEntity.ok(bookingService.getAvailableCourtSlots(sportId));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ClassSessionResponse>> getClasses(
            @RequestParam(required = false) Long sportId,
            Authentication authentication) {
        requireMember(authentication);
        if (sportId == null) {
            return ResponseEntity.ok(bookingService.getUpcomingClasses(actorId(authentication), "MEMBER"));
        }
        return ResponseEntity.ok(bookingService.getClassesForSport(sportId, actorId(authentication)));
    }

    @GetMapping("/coaches/{coachId}")
    public ResponseEntity<com.sporthub.backend.dto.CoachPublicProfileResponse> getCoachProfile(
            @PathVariable Long coachId) {
        return ResponseEntity.ok(bookingService.getCoachPublicProfile(coachId));
    }

    @GetMapping("/quote")
    public ResponseEntity<BookingQuoteResponse> getQuote(
            @RequestParam String bookingType,
            @RequestParam Long itemId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            Authentication authentication) {
        Long memberId = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            try {
                memberId = Long.valueOf(authentication.getName());
            } catch (Exception ignored) {
            }
        }
        LocalDateTime parsedStart = null;
        LocalDateTime parsedEnd = null;
        try {
            if (startTime != null && !startTime.isBlank()) {
                parsedStart = LocalDateTime.parse(startTime.trim().replace("Z", ""));
            }
            if (endTime != null && !endTime.isBlank()) {
                parsedEnd = LocalDateTime.parse(endTime.trim().replace("Z", ""));
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(bookingService.getQuote(bookingType, itemId, parsedStart, parsedEnd, memberId));
    }

    @PostMapping("/checkout")
    public ResponseEntity<BookingConfirmationResponse> checkout(
            @RequestBody CheckoutRequest request,
            Authentication authentication) {
        requireMember(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.checkout(actorId(authentication), request));
    }

    @GetMapping("/schedule")
    public ResponseEntity<List<MemberScheduleEntryResponse>> getSchedule(Authentication authentication) {
        requireMember(authentication);
        return ResponseEntity.ok(bookingService.getMemberScheduleEntries(actorId(authentication)));
    }

    @DeleteMapping("/schedule/{bookingType}/{bookingId}")
    public ResponseEntity<Void> cancelScheduleEntry(
            @PathVariable String bookingType,
            @PathVariable Long bookingId,
            Authentication authentication) {
        requireMember(authentication);
        String normalizedType = bookingType.toUpperCase(java.util.Locale.ROOT);
        if ("CLASS".equals(normalizedType)) {
            bookingService.cancelClassBooking(bookingId, actorId(authentication));
        } else if ("COURT".equals(normalizedType)) {
            bookingService.cancelCourtBooking(bookingId, actorId(authentication));
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Loại booking không hợp lệ.");
        }
        return ResponseEntity.noContent().build();
    }

    private void requireMember(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        boolean isAuthorized = authentication.getAuthorities().stream()
                .anyMatch(authority -> {
                    String auth = authority.getAuthority().toUpperCase(java.util.Locale.ROOT);
                    return auth.contains("MEMBER") || auth.contains("ADMIN") || auth.contains("MANAGER") || auth.contains("CUSTOMER") || auth.contains("USER");
                });
        if (!isAuthorized) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Chỉ tài khoản hội viên hoặc quản trị mới được thực hiện booking.");
        }
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }
}
