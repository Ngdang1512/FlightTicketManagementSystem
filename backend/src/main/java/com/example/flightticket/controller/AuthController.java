package com.example.flightticket.controller;

import com.example.flightticket.dto.auth.AuthResponse;
import com.example.flightticket.dto.auth.AuthUserResponse;
import com.example.flightticket.dto.auth.LoginRequest;
import com.example.flightticket.dto.auth.RefreshTokenRequest;
import com.example.flightticket.dto.auth.RegisterRequest;
import com.example.flightticket.security.JwtPrincipal;
import com.example.flightticket.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.username(), request.password());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal JwtPrincipal principal) {
        return authService.getCurrentUser(principal.username());
    }
}
