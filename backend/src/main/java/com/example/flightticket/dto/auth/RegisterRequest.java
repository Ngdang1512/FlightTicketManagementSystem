package com.example.flightticket.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9._-]{4,50}$") String username,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Email @Size(max = 150) String email,
        @Pattern(regexp = "^(?:\\+84|0)[0-9]{9,10}$") String phone) {
}
