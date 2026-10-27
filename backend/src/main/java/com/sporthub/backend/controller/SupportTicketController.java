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
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class SupportTicketController {

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
        User user = userRepository.findById(memberId)
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

        SupportTicket ticket = SupportTicket.builder()
                .memberId(memberId)
                .memberName(user.getFullName())
                .category(req.category() != null ? req.category() : "OTHER")
                .title(req.title().trim())
                .description(req.description().trim())
                .severity(req.severity() != null ? req.severity() : "NORMAL")
                .status("SUBMITTED")
                .createdAt(LocalDateTime.now())
                .build();

        SupportTicket saved = ticketRepository.save(ticket);
        if (engagementService != null) {
            engagementService.audit(memberId, "MEMBER", "SUPPORT_TICKET_CREATED",
                    "ticketId=" + saved.getTicketId() + ", category=" + saved.getCategory() + ", title=" + saved.getTitle());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    @GetMapping("/api/v1/manager/tickets")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SupportTicketDTO>> getAllTicketsForManager() {
        return ResponseEntity.ok(ticketRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/manager/tickets/{id}/reply")
    @Transactional
    public ResponseEntity<SupportTicketDTO> replyTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại."));

        String reply = body.get("response");
        String status = body.getOrDefault("status", "RESOLVED");

        if (reply != null) {
            ticket.setAdminResponse(reply.trim());
        }
        ticket.setStatus(status);

        SupportTicket saved = ticketRepository.save(ticket);
        if (engagementService != null && auth != null) {
            Long managerId = getUserId(auth);
            engagementService.audit(managerId, "MANAGER", "SUPPORT_TICKET_REPLIED",
                    "ticketId=" + id + ", status=" + saved.getStatus());
            engagementService.notifyUser(saved.getMemberId(), "Phản hồi khiếu nại",
                    "Khiếu nại \"" + saved.getTitle() + "\" của bạn đã có phản hồi từ Quản lý.", "SUPPORT");
        }

        return ResponseEntity.ok(toDTO(saved));
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
