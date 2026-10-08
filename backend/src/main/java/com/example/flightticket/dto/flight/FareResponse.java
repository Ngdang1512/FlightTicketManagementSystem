package com.example.flightticket.dto.flight;

import java.math.BigDecimal;

public record FareResponse(
        Long id,
        String classCode,
        String className,
        BigDecimal price,
        Integer seatQuota,
        Integer availableSeats) {
}
