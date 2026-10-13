package com.sporthub.backend.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.sporthub.backend.dto.AssistantChatRequest;
import com.sporthub.backend.dto.AssistantMessageRequest;
import com.sporthub.backend.dto.CoachPlanRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.MemberHealthProfile;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.MemberHealthProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class AiAssistantService {

    private static final List<String> ACTIVE_BOOKING_STATUSES = List.of("BOOKED", "CONFIRMED");

    private final MemberHealthProfileRepository healthProfileRepository;
    private final BookingRepository bookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String model;

    public AiAssistantService(
            MemberHealthProfileRepository healthProfileRepository,
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            ObjectMapper objectMapper,
            @Value("${app.openai.api-key:}") String apiKey,
            @Value("${app.openai.model:gpt-4o-mini}") String model) {
        this.healthProfileRepository = healthProfileRepository;
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String chatAsMember(Long memberId, AssistantChatRequest request) {
        List<AssistantMessageRequest> messages = validateMessages(request);
        String context = memberContext(memberId);
        return requestCompletion(
                "Bạn là trợ lý tập luyện của SportHub. Trả lời bằng tiếng Việt, thực tế và an toàn. "
                        + "Dùng hồ sơ/lịch đã cung cấp làm ngữ cảnh; không chẩn đoán bệnh. "
                        + "Nếu có chấn thương hoặc dấu hiệu nguy hiểm, khuyên người dùng hỏi chuyên gia y tế.",
                context,
                messages);
    }

    public String createCoachPlan(Long coachId, CoachPlanRequest request) {
        if (request == null || request.bookingId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy lượt đăng ký lớp.");
        }
        if (request.goal() != null && request.goal().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mục tiêu giáo án không được vượt quá 1000 ký tự.");
        }

        Booking booking = bookingRepository.findById(request.bookingId())
                .filter(candidate -> ACTIVE_BOOKING_STATUSES.contains(candidate.getStatus().toUpperCase(Locale.ROOT)))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Lượt đăng ký không còn hiệu lực hoặc không tồn tại."));
        ClassSession session = classSessionRepository.findById(booking.getSessionId())
                .filter(candidate -> Objects.equals(candidate.getCoachId(), coachId))
                .filter(candidate -> !"CANCELLED".equalsIgnoreCase(candidate.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Bạn không được phân công lớp trong lượt đăng ký này."));

        if (booking.getMemberId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Không xác định được hội viên đăng ký lớp.");
        }

        String context = memberContext(booking.getMemberId())
                + "\n\nLớp học viên đã đăng ký với bạn:\n- "
                + session.getClassName() + " lúc " + session.getStartTime() + "\n";
        String goal = request.goal() == null || request.goal().isBlank()
                ? "Tạo giáo án phù hợp với mục tiêu và hồ sơ hiện có."
                : request.goal().trim();
        return requestCompletion(
                "Bạn hỗ trợ HLV chuyên nghiệp soạn giáo án bằng tiếng Việt. "
                        + "Đưa ra kế hoạch có cấu trúc theo buổi, bài tập, số hiệp/lần hoặc thời lượng, "
                        + "mức độ tăng tiến và lưu ý an toàn. Không chẩn đoán bệnh; điều chỉnh hoặc yêu cầu "
                        + "tham vấn chuyên gia nếu hồ sơ có chấn thương.",
                context + "\n\nYêu cầu của HLV: " + goal,
                List.of(new AssistantMessageRequest("user", "Hãy tạo giáo án cho học viên này.")));
    }

    private List<AssistantMessageRequest> validateMessages(AssistantChatRequest request) {
        if (request == null || request.messages() == null || request.messages().isEmpty()
                || request.messages().size() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cuộc trò chuyện cần có từ 1 đến 20 tin nhắn.");
        }
        boolean hasUserMessage = false;
        for (AssistantMessageRequest message : request.messages()) {
            if (message == null || message.role() == null || message.content() == null
                    || message.content().isBlank() || message.content().length() > 4000
                    || !List.of("user", "assistant").contains(message.role().toLowerCase(Locale.ROOT))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn trợ lý không hợp lệ.");
            }
            if ("user".equalsIgnoreCase(message.role())) {
                hasUserMessage = true;
            }
        }
        if (!hasUserMessage || !"user".equalsIgnoreCase(
                request.messages().get(request.messages().size() - 1).role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn cuối phải là câu hỏi của hội viên.");
        }
        return request.messages();
    }

    private String memberContext(Long memberId) {
        MemberHealthProfile profile = healthProfileRepository.findByMemberId(memberId).orElse(null);
        List<Booking> bookings = bookingRepository
                .findByMemberIdAndStatusIn(memberId, ACTIVE_BOOKING_STATUSES);
        List<Long> sessionIds = bookings.stream().map(Booking::getSessionId).distinct().toList();
        List<ClassSession> sessions = sessionIds.isEmpty()
                ? List.of()
                : classSessionRepository.findAllById(sessionIds).stream()
                        .filter(session -> !"CANCELLED".equalsIgnoreCase(session.getStatus()))
                        .toList();

        StringBuilder context = new StringBuilder("Thông tin hội viên lấy từ hồ sơ đã lưu:\n");
        if (profile == null) {
            context.append("- Chưa có hồ sơ sức khỏe.\n");
        } else {
            append(context, "Cấp độ", profile.getFitnessLevel());
            append(context, "Mục tiêu", profile.getFitnessGoals());
            append(context, "Tiền sử chấn thương", profile.getInjuryHistory());
            append(context, "Cân nặng (kg)", profile.getWeightKg());
            append(context, "Chiều cao (cm)", profile.getHeightCm());
            append(context, "BMI", profile.getBmi());
            append(context, "Tỷ lệ mỡ (%)", profile.getPbfPercent());
        }
        context.append("Các lớp đã đăng ký:\n");
        if (sessions.isEmpty()) {
            context.append("- Chưa có lớp nào được đăng ký.\n");
        } else {
            sessions.stream()
                    .sorted((left, right) -> left.getStartTime().compareTo(right.getStartTime()))
                    .limit(20)
                    .forEach(session -> context.append("- ")
                            .append(session.getClassName())
                            .append(" | ")
                            .append(session.getStartTime())
                            .append(" đến ")
                            .append(session.getEndTime())
                            .append('\n'));
        }
        return context.toString();
    }

    private void append(StringBuilder context, String label, Object value) {
        if (value != null && !value.toString().isBlank()) {
            context.append("- ").append(label).append(": ").append(value).append('\n');
        }
    }

    private String requestCompletion(
            String systemPrompt,
            String databaseContext,
            List<AssistantMessageRequest> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Trợ lý AI chưa được cấu hình. Hãy thiết lập biến môi trường OPENAI_API_KEY.");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", model);
        payload.put("temperature", 0.4);
        ArrayNode requestMessages = payload.putArray("messages");
        requestMessages.addObject().put("role", "system")
                .put("content", systemPrompt + "\n\n" + databaseContext);
        for (AssistantMessageRequest message : messages) {
            requestMessages.addObject()
                    .put("role", message.role().toLowerCase(Locale.ROOT))
                    .put("content", message.content());
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Dịch vụ AI từ chối yêu cầu (HTTP " + response.statusCode() + ").");
            }
            JsonNode answer = objectMapper.readTree(response.body())
                    .path("choices").path(0).path("message").path("content");
            if (!answer.isTextual() || answer.asText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Dịch vụ AI trả về nội dung không hợp lệ.");
            }
            return answer.asText();
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không thể tạo yêu cầu cho dịch vụ AI.", exception);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không thể kết nối dịch vụ AI.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Yêu cầu tới dịch vụ AI bị gián đoạn.", exception);
        }
    }
}
