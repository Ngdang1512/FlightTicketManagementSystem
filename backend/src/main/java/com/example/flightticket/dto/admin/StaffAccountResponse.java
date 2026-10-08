package com.example.flightticket.dto.admin;

import java.time.Instant;

public record StaffAccountResponse(Long accountId, String username, String fullName,
                                   String email, String status, Instant createdAt) {}
