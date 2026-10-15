package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AssistantChatRequest;
import com.sporthub.backend.dto.AssistantResponse;
import com.sporthub.backend.dto.CoachPlanRequest;
import com.sporthub.backend.service.AiAssistantService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/chat")
    public AssistantResponse chat(
            @RequestBody AssistantChatRequest request,
            Authentication authentication) {
        requireRole(authentication, "MEMBER");
        return new AssistantResponse(aiAssistantService.chatAsMember(actorId(authentication), request));
    }

    @PostMapping("/coach-plan")
    public AssistantResponse createCoachPlan(
            @RequestBody CoachPlanRequest request,
            Authentication authentication) {
        requireRole(authentication, "COACH");
        return new AssistantResponse(aiAssistantService.createCoachPlan(actorId(authentication), request));
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private void requireRole(Authentication authentication, String expectedRole) {
        boolean allowed = authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(("ROLE_" + expectedRole)::equals);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vai trò tài khoản không được phép thực hiện thao tác này.");
        }
    }
}
