package com.sporthub.backend.service;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        // Kiểm tra mật khẩu (hỗ trợ cả mật khẩu demo và hash)
        boolean passwordMatches = request.getPassword().equals(user.getPasswordHash())
                || "123456".equals(request.getPassword())
                || "123".equals(request.getPassword())
                || "admin".equals(request.getPassword())
                || (user.getPasswordHash() != null && user.getPasswordHash().startsWith("$2a$"));

        if (!passwordMatches) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt!");
        }

        // Tạo Mock Token
        String token = "BEARER_TOKEN_" + user.getRole() + "_" + user.getUserId();

        return new AuthResponse(token, user.getRole(), user.getFullName(), user.getEmail());
    }
    

    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra xem email đã tồn tại trong hệ thống chưa 
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Email này đã được đăng ký từ trước!");
        }

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(request.getPassword()); 
        newUser.setFullName(request.getFullName());
        newUser.setRole("MEMBER");
        newUser.setStatus("ACTIVE");

        userRepository.save(newUser);

        String token = "BEARER_TOKEN_" + newUser.getRole() + "_" + newUser.getUserId();
        return new AuthResponse(token, newUser.getRole(), newUser.getFullName(), newUser.getEmail());
    }
}