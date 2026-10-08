package com.example.flightticket.dto.admin;

import java.time.Instant;

public record AdminCustomerResponse(
        Long accountId,
        Long customerId,
        String username,
        String fullName,
        String email,
        String phone,
        String status,
        long bookingCount,
        Instant createdAt) {
}
