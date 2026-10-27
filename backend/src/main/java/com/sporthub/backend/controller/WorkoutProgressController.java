package com.sporthub.backend.controller;

import com.sporthub.backend.entity.BodyProgressLog;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.WorkoutPlan;
import com.sporthub.backend.repository.BodyProgressLogRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.WorkoutPlanRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Quản lý Kế hoạch tập PT, Kết quả tập luyện, Nhận xét HLV,
 * Bài tập về nhà, Theo dõi tiến độ cơ thể & Gợi ý bài tập AI
 * (COA-07, COA-08, COA-09, COA-10, MEM-20, MEM-21, MEM-22, MEM-23).
 */
@RestController
@RequestMapping("/api/v1/workout-progress")
@CrossOrigin(origins = "*")
public class WorkoutProgressController {

    public record PlanRequest(
            Long memberId,
            String title,
            String goal,
            String exercisesJson,
            String sessionResult,
            String coachFeedback,
            String homework,
            String source
    ) {}

    public record ClassPlanRequest(
            Long sessionId,
            String title,
            String goal,
            String exercisesJson,
            String sessionResult,
            String coachFeedback,
            String homework
    ) {}

    public record BodyLogRequest(
            Long memberId,
            LocalDate recordedDate,
            BigDecimal weightKg,
            BigDecimal heightCm,
            BigDecimal smmKg,
            BigDecimal pbfPercent,
            BigDecimal bmi,
            BigDecimal maxLiftKg,
            String note
    ) {}

    private final WorkoutPlanRepository workoutPlanRepository;
    private final BodyProgressLogRepository bodyProgressLogRepository;
    private final UserRepository userRepository;
    private final EngagementService engagementService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.sporthub.backend.repository.ClassSessionRepository classSessionRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.sporthub.backend.repository.BookingRepository bookingRepository;

    public WorkoutProgressController(
            WorkoutPlanRepository workoutPlanRepository,
            BodyProgressLogRepository bodyProgressLogRepository,
            UserRepository userRepository,
            EngagementService engagementService) {
        this.workoutPlanRepository = workoutPlanRepository;
        this.bodyProgressLogRepository = bodyProgressLogRepository;
        this.userRepository = userRepository;
        this.engagementService = engagementService;
    }

    /**
     * Member xem kế hoạch tập và lịch sử tiến độ cơ thể của chính mình.
     */
    @GetMapping("/me")
    public Map<String, Object> myWorkoutProgress(Authentication auth) {
        Long memberId = actorId(auth);
        List<WorkoutPlan> plans = workoutPlanRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
        List<BodyProgressLog> bodyLogs = bodyProgressLogRepository.findByMemberIdOrderByRecordedDateAsc(memberId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("plans", plans);
        result.put("bodyLogs", bodyLogs);
        return result;
    }

    /**
     * Coach / Manager / Member(chính chủ) xem tiến độ và kế hoạch của 1 học viên.
     */
    @GetMapping("/member/{memberId}")
    public Map<String, Object> memberWorkoutProgress(@PathVariable Long memberId, Authentication auth) {
        Long currentId = actorId(auth);
        String currentRole = actorRole(auth);

        if (!"COACH".equalsIgnoreCase(currentRole) &&
            !"MANAGER".equalsIgnoreCase(currentRole) &&
            !"ADMIN".equalsIgnoreCase(currentRole) &&
            !currentId.equals(memberId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem dữ liệu của hội viên này.");
        }

        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));

        List<WorkoutPlan> plans = workoutPlanRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
        List<BodyProgressLog> bodyLogs = bodyProgressLogRepository.findByMemberIdOrderByRecordedDateAsc(memberId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("memberId", memberId);
        result.put("memberName", member.getFullName());
        result.put("plans", plans);
        result.put("bodyLogs", bodyLogs);
        return result;
    }

    /**
     * Tạo hoặc lưu giáo án tập luyện (COA-07, COA-08, COA-09, COA-10 hoặc AI MEM-23).
     */
    @PostMapping("/plans")
    @Transactional
    public WorkoutPlan createPlan(@RequestBody PlanRequest req, Authentication auth) {
        Long actorId = actorId(auth);
        String role = actorRole(auth);

        if (req == null || req.title() == null || req.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề kế hoạch tập không được để trống.");
        }

        String source = req.source() != null && req.source().equalsIgnoreCase("AI") ? "AI" : "COACH";

        Long targetMemberId;
        Long coachId = null;
        String coachName = null;

        if ("AI".equals(source)) {
            // Member tự lưu kế hoạch gợi ý AI
            targetMemberId = req.memberId() != null ? req.memberId() : actorId;
            coachName = "Trợ lý AI FitGenius";
        } else {
            // Coach soạn giáo án cho học viên
            if (!"COACH".equalsIgnoreCase(role) && !"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ HLV hoặc Quản trị viên mới được tạo giáo án PT.");
            }
            if (req.memberId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn học viên nhận giáo án.");
            }
            targetMemberId = req.memberId();
            coachId = actorId;
            coachName = userRepository.findById(actorId).map(User::getFullName).orElse("Huấn luyện viên");
        }

        String exercisesJson = req.exercisesJson() == null || req.exercisesJson().isBlank()
                ? "[]"
                : req.exercisesJson().trim();

        WorkoutPlan plan = WorkoutPlan.builder()
                .memberId(targetMemberId)
                .coachId(coachId)
                .coachName(coachName)
                .title(req.title().trim())
                .goal(req.goal() == null ? null : req.goal().trim())
                .exercisesJson(exercisesJson)
                .sessionResult(req.sessionResult() == null ? null : req.sessionResult().trim())
                .coachFeedback(req.coachFeedback() == null ? null : req.coachFeedback().trim())
                .homework(req.homework() == null ? null : req.homework().trim())
                .source(source)
                .createdAt(LocalDateTime.now())
                .build();

        WorkoutPlan saved = workoutPlanRepository.save(plan);

        // Gửi thông báo & Ghi nhật ký hệ thống
        if ("COACH".equals(source)) {
            engagementService.notifyUser(
                    targetMemberId,
                    "Kế hoạch tập luyện PT mới từ HLV " + coachName,
                    "HLV vừa cập nhật giáo án: \"" + saved.getTitle() + "\" kèm nhận xét và bài tập về nhà.",
                    "WORKOUT"
            );
            engagementService.audit(actorId, role, "CREATE_WORKOUT_PLAN",
                    "coachId=" + actorId + ", memberId=" + targetMemberId + ", planId=" + saved.getPlanId());
        } else {
            engagementService.audit(actorId, role, "SAVE_AI_WORKOUT_PLAN",
                    "memberId=" + targetMemberId + ", planId=" + saved.getPlanId() + ", title=" + saved.getTitle());
        }

        return saved;
    }

    /**
     * Coach tạo giáo án & bài tập cho toàn bộ học viên trong lớp (Class-wide plan).
     */
    @PostMapping("/class-plans")
    @Transactional
    public Map<String, Object> createClassPlan(@RequestBody ClassPlanRequest req, Authentication auth) {
        Long actorId = actorId(auth);
        String role = actorRole(auth);

        if (!"COACH".equalsIgnoreCase(role) && !"MANAGER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ HLV hoặc Quản trị viên mới được tạo giáo án lớp.");
        }
        if (req == null || req.sessionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn lớp học.");
        }
        if (req.title() == null || req.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề kế hoạch tập không được để trống.");
        }

        if (classSessionRepository == null || bookingRepository == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Dịch vụ lớp học tạm thời không khả dụng.");
        }

        com.sporthub.backend.entity.ClassSession session = classSessionRepository.findById(req.sessionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp học."));

        if ("COACH".equalsIgnoreCase(role) && !session.getCoachId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công lớp học này.");
        }

        String coachName = userRepository.findById(actorId).map(User::getFullName).orElse("Huấn luyện viên");
        List<com.sporthub.backend.entity.Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(
                List.of(session.getSessionId()), List.of("BOOKED", "CONFIRMED"));

        String exercisesJson = req.exercisesJson() == null || req.exercisesJson().isBlank() ? "[]" : req.exercisesJson().trim();
        List<Long> memberIds = bookings.stream().map(com.sporthub.backend.entity.Booking::getMemberId).distinct().toList();

        List<WorkoutPlan> savedPlans = new ArrayList<>();
        for (Long memberId : memberIds) {
            WorkoutPlan plan = WorkoutPlan.builder()
                    .memberId(memberId)
                    .coachId(actorId)
                    .coachName(coachName)
                    .title(req.title().trim())
                    .goal(req.goal() == null ? null : req.goal().trim())
                    .exercisesJson(exercisesJson)
                    .sessionResult(req.sessionResult() == null ? null : req.sessionResult().trim())
                    .coachFeedback(req.coachFeedback() == null ? null : req.coachFeedback().trim())
                    .homework(req.homework() == null ? null : req.homework().trim())
                    .source("COACH")
                    .createdAt(LocalDateTime.now())
                    .build();
            savedPlans.add(workoutPlanRepository.save(plan));

            engagementService.notifyUser(
                    memberId,
                    "Kế hoạch bài tập mới cho lớp " + session.getClassName(),
                    "HLV " + coachName + " vừa giao bài tập cho cả lớp: \"" + req.title().trim() + "\".",
                    "WORKOUT"
            );
        }

        engagementService.audit(actorId, role, "CREATE_CLASS_WORKOUT_PLAN",
                "coachId=" + actorId + ", sessionId=" + session.getSessionId() + ", studentCount=" + memberIds.size());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("ok", true);
        response.put("sessionId", session.getSessionId());
        response.put("className", session.getClassName());
        response.put("createdCount", savedPlans.size());
        response.put("memberCount", memberIds.size());
        return response;
    }

    /**
     * Ghi nhận mốc đo tiến độ cơ thể & mức tạ 1RM (MEM-21, COA-08).
     */
    @PostMapping("/body-logs")
    @Transactional
    public BodyProgressLog recordBodyProgress(@RequestBody BodyLogRequest req, Authentication auth) {
        Long actorId = actorId(auth);
        String role = actorRole(auth);

        Long targetMemberId = (req != null && req.memberId() != null) ? req.memberId() : actorId;
        if (!actorId.equals(targetMemberId) &&
            !"COACH".equalsIgnoreCase(role) &&
            !"MANAGER".equalsIgnoreCase(role) &&
            !"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền nhập chỉ số cho học viên này.");
        }

        LocalDate recordedDate = (req != null && req.recordedDate() != null) ? req.recordedDate() : LocalDate.now();

        if (req != null) {
            if (req.weightKg() != null && req.weightKg().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cân nặng phải lớn hơn 0.");
            }
            if (req.heightCm() != null && req.heightCm().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chiều cao phải lớn hơn 0.");
            }
            if (req.maxLiftKg() != null && req.maxLiftKg().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mức tạ 1RM không thể âm.");
            }
        }

        // Tự động tính BMI nếu chưa có nhưng có weight và height
        BigDecimal bmi = req != null ? req.bmi() : null;
        if (bmi == null && req != null && req.weightKg() != null && req.heightCm() != null && req.heightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = req.heightCm().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            bmi = req.weightKg().divide(heightM.multiply(heightM), 2, RoundingMode.HALF_UP);
        }

        BodyProgressLog log = BodyProgressLog.builder()
                .memberId(targetMemberId)
                .recordedDate(recordedDate)
                .weightKg(req != null ? req.weightKg() : null)
                .heightCm(req != null ? req.heightCm() : null)
                .smmKg(req != null ? req.smmKg() : null)
                .pbfPercent(req != null ? req.pbfPercent() : null)
                .bmi(bmi)
                .maxLiftKg(req != null ? req.maxLiftKg() : null)
                .note(req != null && req.note() != null ? req.note().trim() : null)
                .createdAt(LocalDateTime.now())
                .build();

        BodyProgressLog saved = bodyProgressLogRepository.save(log);

        engagementService.audit(actorId, role, "RECORD_BODY_PROGRESS",
                "memberId=" + targetMemberId + ", date=" + recordedDate + ", weight=" + saved.getWeightKg() + "kg");

        return saved;
    }

    // ------------------------------------------------------------------- Helpers

    private Long actorId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String actorRole(Authentication auth) {
        if (auth == null) return "";
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElse("");
    }
}
