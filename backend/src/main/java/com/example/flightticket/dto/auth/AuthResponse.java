package com.example.flightticket.dto.auth;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long accessTokenExpiresIn,
        String refreshToken,
        long refreshTokenExpiresIn,
        AuthUserResponse user) {
}
