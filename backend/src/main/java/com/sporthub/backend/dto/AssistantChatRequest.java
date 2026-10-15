package com.sporthub.backend.dto;

import java.util.List;

public record AssistantChatRequest(
        List<AssistantMessageRequest> messages) {
}
