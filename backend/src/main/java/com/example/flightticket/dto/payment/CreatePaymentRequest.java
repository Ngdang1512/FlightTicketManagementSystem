package com.example.flightticket.dto.payment;

import com.example.flightticket.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(@NotNull Long bookingId, @NotNull PaymentMethod method) {}
