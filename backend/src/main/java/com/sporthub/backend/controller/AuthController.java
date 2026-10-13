package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import com.sporthub.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // Cho phép ReactJS gọi API không bị lỗi CORS
public class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
 develop
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/session")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim()
                : null;
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }
}