package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AvatarUpdateRequest;
import com.sporthub.backend.dto.CoachFeedbackDTO;
import com.sporthub.backend.dto.CoachProfileResponse;
import com.sporthub.backend.dto.CoachProfileUpdateRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.Feedback;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.FeedbackRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/coach")
@CrossOrigin(origins = "*")
public class CoachProfileController {

    private static final List<String> ACTIVE_STATUSES = List.of("BOOKED", "CONFIRMED");

    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BookingRepository bookingRepository;
    private final PublicSportRepository publicSportRepository;
    private final FeedbackRepository feedbackRepository;

    public CoachProfileController(
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository,
            BookingRepository bookingRepository,
            PublicSportRepository publicSportRepository,
            FeedbackRepository feedbackRepository) {
        this.userRepository = userRepository;
        this.classSessionRepository = classSessionRepository;
        this.bookingRepository = bookingRepository;
        this.publicSportRepository = publicSportRepository;
        this.feedbackRepository = feedbackRepository;
    }

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<CoachProfileResponse> getMyProfile(Authentication auth) {
        Long coachId = getActorId(auth);
        return ResponseEntity.ok(buildCoachProfileResponse(coachId));
    }

    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<CoachProfileResponse> updateMyProfile(
            @RequestBody CoachProfileUpdateRequest request,
            Authentication auth) {
        Long coachId = getActorId(auth);
        User coach = findCoach(coachId);

        if (request.fullName() == null || request.fullName().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống.");
        }

        coach.setFullName(request.fullName().trim());
        if (request.phone() != null) {
            coach.setPhone(request.phone().trim());
        }
        coach.setDateOfBirth(request.dateOfBirth());
        if (request.gender() != null) {
            coach.setGender(request.gender().trim());
        }
        if (request.address() != null) {
            coach.setAddress(request.address().trim());
        }
        if (request.emergencyContactName() != null) {
            coach.setEmergencyContactName(request.emergencyContactName().trim());
        }
        if (request.emergencyContactPhone() != null) {
            coach.setEmergencyContactPhone(request.emergencyContactPhone().trim());
        }

        userRepository.save(coach);
        return ResponseEntity.ok(buildCoachProfileResponse(coachId));
    }

    @PutMapping("/avatar")
    @Transactional
    public ResponseEntity<Map<String, String>> updateMyAvatar(
            @RequestBody AvatarUpdateRequest request,
            Authentication auth) {
        Long coachId = getActorId(auth);
        User coach = findCoach(coachId);

        if (request.avatar() == null || request.avatar().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu ảnh đại diện không hợp lệ.");
        }

        coach.setAvatar(request.avatar().trim());
        userRepository.save(coach);
        return ResponseEntity.ok(Map.of("avatar", coach.getAvatar()));
    }

    private CoachProfileResponse buildCoachProfileResponse(Long coachId) {
        User coach = findCoach(coachId);

        List<ClassSession> activeSessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId).stream()
                .filter(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()))
                .toList();

        List<Long> sportIds = activeSessions.stream().map(ClassSession::getSportId).distinct().toList();
        List<String> sportsTaught = sportIds.isEmpty() ? List.of("Huấn luyện thể thao chuyên nghiệp") :
                publicSportRepository.findAllById(sportIds).stream().map(PublicSport::getName).toList();

        List<Long> sessionIds = activeSessions.stream().map(ClassSession::getSessionId).toList();
        List<Booking> bookings = sessionIds.isEmpty() ? List.of() :
                bookingRepository.findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES);
        int totalStudentsCount = (int) bookings.stream().map(Booking::getMemberId).distinct().count();

        List<Feedback> feedbacks = feedbackRepository.findByCoachIdOrderByCreatedAtDesc(coachId);
        int totalReviewsCount = feedbacks.size();
        Double averageRating = 5.0;
        if (!feedbacks.isEmpty()) {
            double sum = feedbacks.stream()
                    .filter(f -> f.getRating() != null)
                    .mapToInt(Feedback::getRating)
                    .sum();
            long count = feedbacks.stream().filter(f -> f.getRating() != null).count();
            if (count > 0) {
                averageRating = Math.round((sum / count) * 10.0) / 10.0;
            }
        }

        Map<Long, String> memberNames = feedbacks.isEmpty() ? Map.of() :
                userRepository.findAllById(feedbacks.stream().map(Feedback::getMemberId).distinct().toList()).stream()
                        .collect(Collectors.toMap(User::getUserId, User::getFullName));

        List<CoachFeedbackDTO> reviews = feedbacks.stream()
                .map(f -> new CoachFeedbackDTO(
                        f.getFeedbackId(),
                        f.getMemberId(),
                        memberNames.getOrDefault(f.getMemberId(), "Hội viên F Sport"),
                        f.getRating(),
                        f.getComment(),
                        f.getCreatedAt()))
                .toList();

        String specialty = sportsTaught.isEmpty() ? "Đào tạo Thể thao & Thể lực" :
                String.join(", ", sportsTaught) + " · Thể Lực & Phục Hồi";

        return new CoachProfileResponse(
                coach.getUserId(),
                coach.getFullName(),
                coach.getEmail(),
                coach.getPhone(),
                coach.getDateOfBirth(),
                coach.getGender(),
                coach.getAddress(),
                coach.getAvatar(),
                coach.getEmergencyContactName(),
                coach.getEmergencyContactPhone(),
                coach.getRole(),
                coach.getStatus(),
                coach.getCreatedAt(),
                specialty,
                6, // 6 năm kinh nghiệm
                sportsTaught,
                activeSessions.size(),
                totalStudentsCount,
                averageRating,
                totalReviewsCount,
                reviews);
    }

    private User findCoach(Long coachId) {
        return userRepository.findById(coachId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy huấn luyện viên."));
    }

    private Long getActorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }
}
