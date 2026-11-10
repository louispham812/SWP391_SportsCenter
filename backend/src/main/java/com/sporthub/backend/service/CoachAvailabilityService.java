package com.sporthub.backend.service;

import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.CoachLeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;

@Service
public class CoachAvailabilityService {
    private final CoachLeaveRequestRepository leaves;
    private final tools.jackson.databind.ObjectMapper mapper = new tools.jackson.databind.ObjectMapper();
    public CoachAvailabilityService(CoachLeaveRequestRepository leaves) { this.leaves = leaves; }
    public void requireAvailable(User coach, LocalDateTime start, LocalDateTime end) {
        if (!"ACTIVE".equals(coach.getStatus()) || !"COACH".equals(coach.getRole()) || !start.toLocalDate().equals(end.minusNanos(1).toLocalDate()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV hoặc khung giờ không hợp lệ.");
        if (leaves.findByCoachIdOrderByCreatedAtDesc(coach.getUserId()).stream().anyMatch(l -> "APPROVED".equals(l.getStatus())
                && !l.getStartDate().isAfter(start.toLocalDate()) && !l.getEndDate().isBefore(start.toLocalDate())))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV đang nghỉ phép.");
        String json = coach.getAvailabilityJson();
        if (json == null || json.isBlank() || "{}".equals(json)) return;
        try {
            var days = mapper.readTree(json);
            if (!days.isArray()) throw new IllegalArgumentException();
            var day = java.util.stream.StreamSupport.stream(days.spliterator(), false)
                .filter(d -> start.getDayOfWeek().name().equals(d.path("day").asText())).findFirst().orElseThrow();
            for (LocalDateTime time = start; time.isBefore(end); time = time.plusMinutes(1)) {
                String shift = time.getHour() < 12 ? "morning" : time.getHour() < 18 ? "afternoon" : "evening";
                if (!day.path(shift).asBoolean()) throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV chưa đăng ký rảnh trong khung giờ này.");
            }
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch rảnh HLV chưa hợp lệ; cần cập nhật trước khi xếp ca."); }
    }
}
