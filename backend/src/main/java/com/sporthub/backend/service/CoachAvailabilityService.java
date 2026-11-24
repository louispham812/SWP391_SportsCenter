package com.sporthub.backend.service;

import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.CoachLeaveRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.StreamSupport;

@Service
public class CoachAvailabilityService {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter SESSION_TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final CoachLeaveRequestRepository leaves;

    public CoachAvailabilityService(CoachLeaveRequestRepository leaves) {
        this.leaves = leaves;
    }

    public void requireAvailable(User coach, LocalDateTime start, LocalDateTime end) {
        if (!"ACTIVE".equals(coach.getStatus()) || !"COACH".equals(coach.getRole()) || !start.toLocalDate().equals(end.minusNanos(1).toLocalDate()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV hoặc khung giờ không hợp lệ.");
        if (leaves.findByCoachIdOrderByCreatedAtDesc(coach.getUserId()).stream().anyMatch(l -> "APPROVED".equals(l.getStatus())
                && !l.getStartDate().isAfter(start.toLocalDate()) && !l.getEndDate().isBefore(start.toLocalDate())))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV đang nghỉ phép.");
        String json = coach.getAvailabilityJson();
        if (json == null || json.isBlank() || "{}".equals(json)) return;
        try {
            JsonNode days = MAPPER.readTree(json);
            if (!days.isArray()) throw new IllegalArgumentException();
            JsonNode day = StreamSupport.stream(days.spliterator(), false)
                .filter(d -> start.getDayOfWeek().name().equals(d.path("day").asText())).findFirst().orElseThrow();
            for (LocalDateTime time = start; time.isBefore(end); time = time.plusMinutes(1)) {
                String shift = shiftForHour(time.getHour());
                if (!day.path(shift).asBoolean()) throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV chưa đăng ký rảnh trong khung giờ này.");
            }
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch rảnh HLV chưa hợp lệ; cần cập nhật trước khi xếp ca."); }
    }

    /**
     * Ngăn HLV tắt một ca rảnh nếu đang có buổi dạy chưa diễn ra rơi vào đúng thứ và ca đó.
     * Bất cứ ca nào đã từng tắt trước đó sẽ được bỏ qua để tránh khóa cứng (deadlock) khi bật các ca khác.
     */
    public static void validateUpdateAgainstSessions(String currentJson, String newJson, List<ClassSession> coachSessions) {
        if (newJson == null || newJson.isBlank() || "{}".equals(newJson.trim())) {
            return;
        }
        JsonNode newDays;
        try {
            newDays = MAPPER.readTree(newJson);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định dạng lịch rảnh không hợp lệ.");
        }
        if (!newDays.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định dạng lịch rảnh không hợp lệ.");
        }
        if (coachSessions == null || coachSessions.isEmpty()) {
            return;
        }

        JsonNode currentDays = parseArrayOrNull(currentJson);
        LocalDateTime now = LocalDateTime.now();

        for (ClassSession session : coachSessions) {
            if (session.getStartTime() == null || session.getEndTime() == null) {
                continue;
            }
            if (!session.getEndTime().isAfter(now)) {
                continue;
            }
            String status = session.getStatus();
            if ("CANCELLED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                continue;
            }
            for (LocalDateTime t = session.getStartTime(); t.isBefore(session.getEndTime()); t = t.plusMinutes(1)) {
                String dayName = t.getDayOfWeek().name();
                String shift = shiftForHour(t.getHour());
                boolean newOpen = isSlotOpen(newDays, dayName, shift);
                boolean oldOpen = (currentDays == null) || isSlotOpen(currentDays, dayName, shift);
                if (oldOpen && !newOpen) {
                    String className = session.getClassName() != null ? session.getClassName() : "Lớp học";
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            String.format(
                                    "Không thể tắt ca %s %s vì bạn đã có lịch dạy \"%s\" (%s). Vui lòng gửi Đơn xin nghỉ & đổi ca nếu muốn nghỉ.",
                                    shiftLabelVi(shift),
                                    dayLabelVi(t.getDayOfWeek()),
                                    className,
                                    session.getStartTime().format(SESSION_TIME_FMT)));
                }
            }
        }
    }

    private static String shiftForHour(int hour) {
        return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    }

    private static JsonNode parseArrayOrNull(String json) {
        if (json == null || json.isBlank() || "{}".equals(json.trim())) {
            return null;
        }
        try {
            JsonNode node = MAPPER.readTree(json);
            return node.isArray() ? node : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean isSlotOpen(JsonNode days, String dayName, String shift) {
        for (JsonNode d : days) {
            if (dayName.equalsIgnoreCase(d.path("day").asText())) {
                return d.path(shift).asBoolean(false);
            }
        }
        return false;
    }

    private static String shiftLabelVi(String shift) {
        return switch (shift) {
            case "morning" -> "Sáng";
            case "afternoon" -> "Chiều";
            default -> "Tối";
        };
    }

    private static String dayLabelVi(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Thứ Hai";
            case TUESDAY -> "Thứ Ba";
            case WEDNESDAY -> "Thứ Tư";
            case THURSDAY -> "Thứ Năm";
            case FRIDAY -> "Thứ Sáu";
            case SATURDAY -> "Thứ Bảy";
            case SUNDAY -> "Chủ Nhật";
        };
    }
}
