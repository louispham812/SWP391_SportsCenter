package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateTicketRequest;
import com.sporthub.backend.dto.SupportTicketDTO;
import com.sporthub.backend.entity.SupportTicket;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.SupportTicketRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.service.EngagementService;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@CrossOrigin(origins = "*")
public class SupportTicketController {

    private static final Set<String> VALID_STATUSES = Set.of("SUBMITTED", "IN_REVIEW", "RESOLVED", "REJECTED");

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EngagementService engagementService;

    @Autowired
    public SupportTicketController(
            SupportTicketRepository ticketRepository,
            UserRepository userRepository,
            EngagementService engagementService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.engagementService = engagementService;
    }

    public SupportTicketController(
            SupportTicketRepository ticketRepository,
            UserRepository userRepository) {
        this(ticketRepository, userRepository, null);
    }

    @GetMapping("/api/v1/members/me/tickets")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SupportTicketDTO>> getMyTickets(Authentication auth) {
        Long memberId = getUserId(auth);
        return ResponseEntity.ok(ticketRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/members/me/tickets")
    @Transactional
    public ResponseEntity<SupportTicketDTO> createTicket(
            @RequestBody CreateTicketRequest req,
            Authentication auth) {
        Long memberId = getUserId(auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createTicketForMember(memberId, req, memberId, "MEMBER", false));
    }

    @GetMapping("/api/v1/manager/tickets")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SupportTicketDTO>> getAllTicketsForManager(Authentication auth) {
        requireAnyRole(auth, "MANAGER", "ADMIN");
        return ResponseEntity.ok(ticketRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/manager/tickets")
    @Transactional
    public ResponseEntity<SupportTicketDTO> createTicketByManager(
            @RequestBody CreateTicketRequest req,
            Authentication auth) {
        String role = requireAnyRole(auth, "MANAGER", "ADMIN");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createTicketForMember(requireMemberId(req), req, getUserId(auth), role, true));
    }

    @PostMapping("/api/v1/manager/tickets/{id}/reply")
    @Transactional
    public ResponseEntity<SupportTicketDTO> replyTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String role = requireAnyRole(auth, "MANAGER", "ADMIN");
        return ResponseEntity.ok(processReply(id, body, getUserId(auth), role));
    }

    @GetMapping({"/api/v1/receptionist/tickets", "/api/v1/reception/tickets"})
    @Transactional(readOnly = true)
    public ResponseEntity<List<SupportTicketDTO>> getAllTicketsForReceptionist(Authentication auth) {
        requireAnyRole(auth, "RECEPTIONIST", "MANAGER", "ADMIN");
        return ResponseEntity.ok(ticketRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
    }

    @PostMapping({"/api/v1/receptionist/tickets", "/api/v1/reception/tickets"})
    @Transactional
    public ResponseEntity<SupportTicketDTO> createTicketByReceptionist(
            @RequestBody CreateTicketRequest req,
            Authentication auth) {
        String role = requireAnyRole(auth, "RECEPTIONIST", "MANAGER", "ADMIN");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createTicketForMember(requireMemberId(req), req, getUserId(auth), role, true));
    }

    @PostMapping({"/api/v1/receptionist/tickets/{id}/reply", "/api/v1/reception/tickets/{id}/reply"})
    @Transactional
    public ResponseEntity<SupportTicketDTO> replyTicketByReceptionist(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String role = requireAnyRole(auth, "RECEPTIONIST", "MANAGER", "ADMIN");
        return ResponseEntity.ok(processReply(id, body, getUserId(auth), role));
    }

    private Long requireMemberId(CreateTicketRequest req) {
        if (req == null || req.memberId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hội viên cần tạo yêu cầu hỗ trợ.");
        }
        return req.memberId();
    }

    private SupportTicketDTO createTicketForMember(
            Long memberId,
            CreateTicketRequest req,
            Long actorId,
            String actorRole,
            boolean notifyMember) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu khiếu nại không hợp lệ.");
        }
        User member = userRepository.findById(memberId)
                .filter(u -> !notifyMember || "MEMBER".equalsIgnoreCase(u.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

        if (req.title() == null || req.title().isBlank() || req.description() == null || req.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề và nội dung khiếu nại không được để trống.");
        }
        if (req.title().trim().length() < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề khiếu nại phải có ít nhất 5 ký tự (BR-15).");
        }
        if (req.description().trim().length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung khiếu nại phải có ít nhất 10 ký tự (BR-15).");
        }

        String category = req.category() != null && !req.category().isBlank()
                ? req.category().trim().toUpperCase(Locale.ROOT)
                : "OTHER";
        String severity = "URGENT".equalsIgnoreCase(req.severity()) ? "URGENT" : "NORMAL";

        SupportTicket ticket = SupportTicket.builder()
                .memberId(memberId)
                .memberName(member.getFullName())
                .category(category)
                .title(req.title().trim())
                .description(req.description().trim())
                .severity(severity)
                .status("SUBMITTED")
                .createdAt(LocalDateTime.now())
                .build();

        SupportTicket saved = ticketRepository.save(ticket);
        if (engagementService != null) {
            engagementService.audit(actorId, actorRole, "SUPPORT_TICKET_CREATED",
                    "ticketId=" + saved.getTicketId() + ", memberId=" + memberId
                            + ", category=" + saved.getCategory() + ", title=" + saved.getTitle());
            if (notifyMember) {
                engagementService.notifyUser(memberId, "Yêu cầu hỗ trợ đã được ghi nhận",
                        "Trung tâm đã tiếp nhận ticket \"" + saved.getTitle() + "\" thay mặt bạn.", "SUPPORT");
            }
        }

        return toDTO(saved);
    }

    private SupportTicketDTO processReply(Long id, Map<String, String> body, Long actorId, String actorRole) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại."));

        String reply = body == null ? null : body.get("response");
        String rawStatus = body == null ? null : body.get("status");
        String status = rawStatus == null || rawStatus.isBlank()
                ? "RESOLVED"
                : rawStatus.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái xử lý ticket không hợp lệ.");
        }

        if (reply != null && !reply.isBlank()) {
            ticket.setAdminResponse(reply.trim());
        }
        ticket.setStatus(status);

        SupportTicket saved = ticketRepository.save(ticket);
        if (engagementService != null) {
            engagementService.audit(actorId, actorRole, "SUPPORT_TICKET_REPLIED",
                    "ticketId=" + id + ", status=" + saved.getStatus());
            String responderLabel = "RECEPTIONIST".equals(actorRole) ? "Lễ tân" : "Quản lý";
            String statusLabel = switch (saved.getStatus()) {
                case "IN_REVIEW" -> "Đang xử lý";
                case "RESOLVED" -> "Đã giải quyết";
                case "REJECTED" -> "Từ chối";
                default -> saved.getStatus();
            };
            engagementService.notifyUser(saved.getMemberId(), "Phản hồi khiếu nại",
                    "Khiếu nại \"" + saved.getTitle() + "\" của bạn đã được " + responderLabel + " cập nhật (" + statusLabel + ").", "SUPPORT");
        }

        return toDTO(saved);
    }

    private SupportTicketDTO toDTO(SupportTicket t) {
        return new SupportTicketDTO(
                t.getTicketId(),
                t.getMemberId(),
                t.getMemberName(),
                t.getCategory(),
                t.getTitle(),
                t.getDescription(),
                t.getSeverity(),
                t.getStatus(),
                t.getAdminResponse(),
                t.getCreatedAt());
    }

    private String requireAnyRole(Authentication auth, String... allowedRoles) {
        if (auth == null || auth.getAuthorities() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a != null && a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()).toUpperCase(Locale.ROOT))
                .findFirst()
                .orElse("");
        for (String allowed : allowedRoles) {
            if (allowed.equals(role)) {
                return role;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng hỗ trợ này.");
    }

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
        }
    }
}
