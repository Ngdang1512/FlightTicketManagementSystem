package com.example.flightticket.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminBookingResponse(Long id, String bookingCode, String customerName, String customerEmail,
                                   String route, String flightNumber, int passengerCount, BigDecimal totalAmount,
                                   String status, Instant bookedAt) {}
