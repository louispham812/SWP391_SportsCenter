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
        String lastUserMessage = messages.stream()
                .filter(m -> "user".equalsIgnoreCase(m.role()))
                .map(AssistantMessageRequest::content)
                .reduce((first, second) -> second)
                .orElse("Tư vấn bài tập và lịch trình");

        if (apiKey == null || apiKey.isBlank()) {
            return generateDomainAnswer(lastUserMessage, databaseContext);
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
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode answer = objectMapper.readTree(response.body())
                        .path("choices").path(0).path("message").path("content");
                if (answer.isTextual() && !answer.asText().isBlank()) {
                    return answer.asText();
                }
            }
            return generateDomainAnswer(lastUserMessage, databaseContext);
        } catch (Exception exception) {
            return generateDomainAnswer(lastUserMessage, databaseContext);
        }
    }

    private String generateDomainAnswer(String userQuestion, String databaseContext) {
        String q = userQuestion.toLowerCase(Locale.ROOT);

        if (q.contains("hủy") || q.contains("hoàn tiền") || q.contains("chính sách")) {
            return "📌 **Quy định Hủy lịch & Hoàn tiền tại F Sport Center:**\n\n" +
                    "1. **Điều kiện hủy hợp lệ:** Bạn có thể hủy đặt sân hoặc lớp học trước giờ bắt đầu **ít nhất 2 tiếng**.\n" +
                    "2. **Chính sách hoàn tiền:** Sau khi hủy thành công, 100% chi phí được hoàn ngay lập tức về tài khoản/lịch sử giao dịch sandbox của bạn.\n" +
                    "3. **Tự động cập nhật:** Buổi học trong tương lai sẽ lập tức được xóa khỏi thời khóa biểu cá nhân của bạn. Suất trống sẽ tự động nhường cho học viên trong danh sách chờ (Waitlist).\n\n" +
                    "Bạn có thể vào mục **Thời khóa biểu** và nhấn nút **Hủy đăng ký** bất cứ lúc nào đáp ứng điều kiện trên.";
        }

        if (q.contains("gói") || q.contains("bảng giá") || q.contains("gia hạn") || q.contains("nâng cấp")) {
            return "💳 **Quy định Gói Thành Viên & Gia hạn F Sport:**\n\n" +
                    "- **Gia hạn gói hiện tại:** Bạn có thể gia hạn gói đang dùng bất cứ lúc nào, thời hạn sử dụng sẽ được cộng dồn thêm theo số ngày của gói.\n" +
                    "- **Nâng cấp gói cao hơn:** Bạn có thể nâng cấp lên các gói có quyền lợi cao hơn (ví dụ từ Basic lên Gold hoặc Diamond VIP).\n" +
                    "- **Chính sách hạ cấp:** Để đảm bảo quyền lợi và tính liên tục của thẻ hội viên, hệ thống không cho phép đăng ký hạ xuống gói có mức phí thấp hơn gói đang còn hiệu lực.\n\n" +
                    "👉 Bạn có thể vào tab **Gói tập & Thẻ số** trong trang cá nhân để thực hiện gia hạn hoặc nâng cấp ngay.";
        }

        if (q.contains("lịch") || q.contains("lớp") || q.contains("tuần này") || q.contains("hôm nay")) {
            return "🗓️ **Thông tin Lịch tập của bạn:**\n\n" +
                    "Dựa trên dữ liệu hệ thống F Sport Center:\n" +
                    databaseContext + "\n\n" +
                    "💡 **Lời khuyên HLV:** Hãy khởi động kỹ khớp 10-15 phút trước giờ tập, chuẩn bị bình nước cá nhân và khăn tập. Nếu có việc bận đột xuất, vui lòng hủy trước ít nhất 2 tiếng để được hoàn tiền nhé!";
        }

        if (q.contains("bài tập") || q.contains("ngực") || q.contains("chân") || q.contains("lưng") || q.contains("tăng cơ") || q.contains("giảm mỡ") || q.contains("inbody")) {
            return "🏋️ **Gợi ý Kế hoạch Tập Luyện từ AI Smart Coach:**\n\n" +
                    "Dựa trên hồ sơ thể trạng của bạn:\n" +
                    databaseContext + "\n\n" +
                    "**Lộ trình đề xuất trong tuần:**\n" +
                    "1. **Khởi động (10 phút):** Xoay khớp, chạy bước nhỏ, giãn cơ động.\n" +
                    "2. **Phần bài tập chính (40 phút):**\n" +
                    "   - *Bài 1 (Compound):* 4 hiệp x 8-10 reps (nghỉ 90s giữa các hiệp).\n" +
                    "   - *Bài 2 (Isolation):* 3 hiệp x 12 reps tập trung cảm nhận cơ bắp.\n" +
                    "   - *Bài 3 (Core/Thể lực):* Plank 3 hiệp x 45s hoặc bài tập bổ trợ.\n" +
                    "3. **Hồi phục (10 phút):** Giãn cơ tĩnh, bù nước điện giải và protein sau tập 30 phút.\n\n" +
                    "Bạn có thể đặt lịch tập cùng HLV trong mục **Đăng ký lớp học** để được hướng dẫn chuẩn tư thế nhất!";
        }

        return "Chào bạn! Tôi là **AI Smart Coach** của F Sport Center.\n\n" +
                "Tôi có thể hỗ trợ bạn:\n" +
                "1. Tra cứu thời khóa biểu & lịch tập các môn thể thao.\n" +
                "2. Hướng dẫn kỹ thuật và gợi ý bài tập theo chỉ số InBody cá nhân.\n" +
                "3. Giải đáp quy định đăng ký, gia hạn gói tập và chính sách hủy lớp/hoàn tiền.\n" +
                "4. Đánh giá tiến độ thể lực từ các nhận xét của Huấn luyện viên.\n\n" +
                "Hôm nay bạn cần trợ giúp điều gì?";
    }
}
