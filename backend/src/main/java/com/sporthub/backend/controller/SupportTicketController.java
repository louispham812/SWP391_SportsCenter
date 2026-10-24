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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class SupportTicketController {

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;

    public SupportTicketController(
            SupportTicketRepository ticketRepository,
            UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
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

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(ticketRepository.save(ticket)));
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
            @RequestBody Map<String, String> body) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại."));

        String reply = body.get("response");
        String status = body.getOrDefault("status", "RESOLVED");

        if (reply != null) {
            ticket.setAdminResponse(reply.trim());
        }
        ticket.setStatus(status);

        return ResponseEntity.ok(toDTO(ticketRepository.save(ticket)));
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
