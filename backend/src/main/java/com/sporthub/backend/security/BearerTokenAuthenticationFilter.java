package com.sporthub.backend.security;

import com.sporthub.backend.entity.AuthSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

public class BearerTokenAuthenticationFilter extends OncePerRequestFilter {

    private final AuthSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public BearerTokenAuthenticationFilter(
            AuthSessionRepository sessionRepository,
            UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7).trim();
            if (!token.isEmpty()) {
                authenticate(token);
            }
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String token) {
        String tokenHash = sha256(token);
        Optional<AuthSession> session = sessionRepository
                .findByTokenHashAndExpiresAtAfter(tokenHash, LocalDateTime.now());
        if (session.isEmpty()) {
            return;
        }

        Optional<User> user = userRepository.findById(session.get().getUserId());
        if (user.isEmpty() || !"ACTIVE".equals(user.get().getStatus())) {
            return;
        }

        String role = user.get().getRole().toUpperCase();
        var authentication = new UsernamePasswordAuthenticationToken(
                user.get().getUserId().toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    public static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable.", e);
        }
    }
}
