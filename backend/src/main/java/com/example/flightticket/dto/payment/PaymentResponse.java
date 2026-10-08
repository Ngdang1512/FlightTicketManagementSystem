package com.example.flightticket.dto.payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(Long id, Long bookingId, String transactionCode, BigDecimal amount,
                              String method, String status, Instant paidAt) {}
