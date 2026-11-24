package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AvatarUpdateRequest;
import com.sporthub.backend.dto.CoachFeedbackDTO;
import com.sporthub.backend.dto.CoachIncomeResponse;
import com.sporthub.backend.dto.CoachProfileResponse;
import com.sporthub.backend.dto.CoachProfileUpdateRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.Feedback;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.FeedbackRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.SystemSettingRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.util.SystemPolicyHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.sporthub.backend.service.EngagementService engagementService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FacilityRepository facilityRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private PublicFacilityRepository publicFacilityRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SystemSettingRepository systemSettingRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SportRepository domainSportRepository;

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

        if (request.fullName() != null && !request.fullName().trim().isBlank()) {
            coach.setFullName(request.fullName().trim());
        }
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
        if (request.specialty() != null) {
            coach.setSpecialty(request.specialty().trim());
        }
        if (request.experienceYears() != null) {
            coach.setExperienceYears(request.experienceYears());
        }
        if (request.certifications() != null) {
            coach.setCertifications(request.certifications().trim());
        }
        if (request.bio() != null) {
            coach.setBio(request.bio().trim());
        }

        userRepository.save(coach);
        return ResponseEntity.ok(buildCoachProfileResponse(coachId));
    }

    @GetMapping("/availability")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getAvailability(Authentication auth) {
        Long coachId = getActorId(auth);
        User coach = findCoach(coachId);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("coachId", coachId);
        res.put("availabilityJson", coach.getAvailabilityJson() != null ? coach.getAvailabilityJson() : "{}");
        return ResponseEntity.ok(res);
    }

    @PutMapping("/availability")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateAvailability(
            @RequestBody(required = false) Map<String, String> request,
            Authentication auth) {
        Long coachId = getActorId(auth);
        User coach = findCoach(coachId);
        String targetJson = (request != null && request.get("availabilityJson") != null)
                ? request.get("availabilityJson")
                : "{}";
        com.sporthub.backend.service.CoachAvailabilityService.validateUpdateAgainstSessions(
                coach.getAvailabilityJson(),
                targetJson,
                classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId));
        coach.setAvailabilityJson(targetJson);
        userRepository.save(coach);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("coachId", coachId);
        res.put("availabilityJson", coach.getAvailabilityJson());
        res.put("updated", true);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/income")
    @Transactional(readOnly = true)
    public ResponseEntity<CoachIncomeResponse> getIncomeSummary(Authentication auth) {
        Long coachId = getActorId(auth);
        findCoach(coachId);

        LocalDateTime now = LocalDateTime.now();
        List<ClassSession> sessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId).stream()
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getStartTime() == null || !s.getStartTime().isAfter(now))
                .toList();

        Map<Long, String> sportNames = new LinkedHashMap<>();
        if (domainSportRepository != null) {
            domainSportRepository.findAll().forEach(sp -> sportNames.put(sp.getSportId(), sp.getSportName()));
        } else {
            publicSportRepository.findAll().forEach(sp -> sportNames.put(sp.getSportId(), sp.getName()));
        }

        Map<Long, String> courtNames = new LinkedHashMap<>();
        if (facilityRepository != null) {
            facilityRepository.findAll().forEach(f -> courtNames.put(f.getFacilityId(), f.getFacilityName()));
        } else if (publicFacilityRepository != null) {
            publicFacilityRepository.findAll().forEach(f -> courtNames.put(f.getFacilityId(), f.getName()));
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalIncome = BigDecimal.ZERO;
        int totalStudents = 0;
        BigDecimal commissionRate = BigDecimal.valueOf(
                SystemPolicyHelper.coachCommissionPercent(systemSettingRepository));

        List<CoachIncomeResponse.SessionIncomeDetail> details = new ArrayList<>();
        for (ClassSession s : sessions) {
            List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(
                    List.of(s.getSessionId()), ACTIVE_STATUSES);
            int students = bookings.size();
            totalStudents += students;

            BigDecimal price = s.getPriceAmount() != null ? s.getPriceAmount() : BigDecimal.valueOf(100000);
            BigDecimal sessionRevenue = price.multiply(BigDecimal.valueOf(students));
            totalRevenue = totalRevenue.add(sessionRevenue);

            // Thù lao theo cấu hình hệ thống (mặc định 40%) hoặc tối thiểu 200,000đ/ca nếu lớp không bị hủy
            BigDecimal commission = sessionRevenue.multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (commission.compareTo(BigDecimal.valueOf(200000)) < 0 && !"CANCELLED".equalsIgnoreCase(s.getStatus())) {
                commission = BigDecimal.valueOf(200000);
            }
            totalIncome = totalIncome.add(commission);

            details.add(new CoachIncomeResponse.SessionIncomeDetail(
                    s.getSessionId(),
                    s.getClassName(),
                    s.getStartTime(),
                    s.getEndTime(),
                    s.getStatus(),
                    students,
                    price,
                    sessionRevenue,
                    commission,
                    sportNames.get(s.getSportId()),
                    courtNames.get(s.getFacilityId())
            ));
        }

        return ResponseEntity.ok(new CoachIncomeResponse(
                totalIncome,
                totalRevenue,
                sessions.size(),
                totalStudents,
                commissionRate,
                details
        ));
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

    @PostMapping("/send-notice")
    @Transactional
    public ResponseEntity<Map<String, Object>> sendNotice(
            @RequestBody com.sporthub.backend.dto.CoachSendNoticeRequest request,
            Authentication auth) {
        Long coachId = getActorId(auth);
        User coach = findCoach(coachId);

        if (request == null || request.title() == null || request.title().isBlank()
                || request.message() == null || request.message().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề và nội dung thông báo không được để trống.");
        }

        if (engagementService == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Dịch vụ thông báo tạm thời không khả dụng.");
        }

        String title = request.title().trim();
        String message = request.message().trim();
        Map<String, Object> result = new LinkedHashMap<>();

        if (request.sessionId() != null) {
            ClassSession session = classSessionRepository.findById(request.sessionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp học."));

            if (!session.getCoachId().equals(coachId) && !"MANAGER".equalsIgnoreCase(coach.getRole()) && !"ADMIN".equalsIgnoreCase(coach.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công phụ trách lớp học này.");
            }

            List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(
                    List.of(session.getSessionId()), ACTIVE_STATUSES);
            List<Long> memberIds = bookings.stream().map(Booking::getMemberId).distinct().toList();

            for (Long memberId : memberIds) {
                engagementService.notifyUser(memberId, title, message, "COACH_NOTICE");
            }

            engagementService.audit(coachId, "COACH", "COACH_SEND_CLASS_NOTICE",
                    "sessionId=" + session.getSessionId() + ", studentCount=" + memberIds.size() + ", title=" + title);

            result.put("ok", true);
            result.put("target", "CLASS");
            result.put("className", session.getClassName());
            result.put("sentCount", memberIds.size());
        } else if (request.memberId() != null) {
            User student = userRepository.findById(request.memberId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy học viên."));

            if (!"MANAGER".equalsIgnoreCase(coach.getRole()) && !"ADMIN".equalsIgnoreCase(coach.getRole())) {
                Set<Long> coachSessionIds = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId).stream()
                        .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                        .map(ClassSession::getSessionId)
                        .collect(Collectors.toSet());
                boolean isAssignedStudent = !coachSessionIds.isEmpty()
                        && bookingRepository.findByMemberId(student.getUserId()).stream()
                                .anyMatch(b -> coachSessionIds.contains(b.getSessionId())
                                        && !"CANCELLED".equalsIgnoreCase(b.getStatus()));
                if (!isAssignedStudent) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Bạn chỉ có thể gửi thông báo cho học viên đang học trong lớp của mình.");
                }
            }

            engagementService.notifyUser(student.getUserId(), title, message, "COACH_NOTICE");

            engagementService.audit(coachId, "COACH", "COACH_SEND_STUDENT_NOTICE",
                    "memberId=" + student.getUserId() + ", title=" + title);

            result.put("ok", true);
            result.put("target", "STUDENT");
            result.put("studentName", student.getFullName());
            result.put("sentCount", 1);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn học viên hoặc lớp học cần gửi thông báo.");
        }

        return ResponseEntity.ok(result);
    }

    private CoachProfileResponse buildCoachProfileResponse(Long coachId) {
        User coach = findCoach(coachId);

        List<ClassSession> activeSessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coachId).stream()
                .filter(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()))
                .toList();

        List<String> coachedSportNames = coach.getCoachedSports() == null ? List.of()
                : coach.getCoachedSports().stream()
                        .map(Sport::getSportName)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
        List<Long> sportIds = activeSessions.stream().map(ClassSession::getSportId).distinct().toList();
        List<String> sportsTaught = !coachedSportNames.isEmpty()
                ? coachedSportNames
                : (sportIds.isEmpty()
                        ? List.of("Huấn luyện thể thao chuyên nghiệp")
                        : (domainSportRepository != null
                                ? domainSportRepository.findAllById(sportIds).stream().map(Sport::getSportName).toList()
                                : publicSportRepository.findAllById(sportIds).stream().map(PublicSport::getName).toList()));

        List<Long> sessionIds = activeSessions.stream().map(ClassSession::getSessionId).toList();
        List<Booking> bookings = sessionIds.isEmpty() ? List.of() :
                bookingRepository.findBySessionIdInAndStatusIn(sessionIds, ACTIVE_STATUSES);
        int totalStudentsCount = (int) bookings.stream().map(Booking::getMemberId).distinct().count();

        List<Feedback> feedbacks = feedbackRepository.findByCoachIdOrderByCreatedAtDesc(coachId);
        int totalReviewsCount = feedbacks.size();
        Double averageRating = 0.0;
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

        String specialty = (coach.getSpecialty() != null && !coach.getSpecialty().isBlank())
                ? coach.getSpecialty()
                : (sportsTaught.isEmpty() ? "Đào tạo Thể thao & Thể lực" : String.join(", ", sportsTaught) + " · Thể Lực & Phục Hồi");

        int expYears = coach.getExperienceYears() != null ? coach.getExperienceYears() : 5;

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
                expYears,
                coach.getCertifications(),
                coach.getBio(),
                coach.getAvailabilityJson(),
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
