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
        requireAnyRole(authentication, "MEMBER", "CUSTOMER", "COACH", "RECEPTIONIST", "MANAGER", "ADMIN");
        return new AssistantResponse(aiAssistantService.chatAsMember(actorId(authentication), request));
    }

    @PostMapping("/coach-plan")
    public AssistantResponse createCoachPlan(
            @RequestBody CoachPlanRequest request,
            Authentication authentication) {
        requireAnyRole(authentication, "COACH", "MANAGER", "ADMIN");
        return new AssistantResponse(aiAssistantService.createCoachPlan(actorId(authentication), actorRole(authentication), request));
    }

    private Long actorId(Authentication authentication) {
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String actorRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "";
        }
        return authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .map(auth -> auth.startsWith("ROLE_") ? auth.substring(5) : auth)
                .findFirst()
                .orElse("");
    }

    private void requireAnyRole(Authentication authentication, String... expectedRoles) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vai trò tài khoản không được phép thực hiện thao tác này.");
        }
        java.util.Set<String> allowedRoles = java.util.Arrays.stream(expectedRoles)
                .map(r -> "ROLE_" + r)
                .collect(java.util.stream.Collectors.toSet());
        boolean allowed = authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(allowedRoles::contains);
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vai trò tài khoản không được phép thực hiện thao tác này.");
        }
    }

    private void requireRole(Authentication authentication, String expectedRole) {
        requireAnyRole(authentication, expectedRole);
    }
}
