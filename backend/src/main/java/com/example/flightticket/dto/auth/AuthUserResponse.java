package com.example.flightticket.dto.auth;

public record AuthUserResponse(
        Long accountId,
        Long customerId,
        String username,
        String fullName,
        String email,
        String role) {
}
