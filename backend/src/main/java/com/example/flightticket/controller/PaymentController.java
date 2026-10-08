package com.example.flightticket.controller;

import com.example.flightticket.dto.payment.*;
import com.example.flightticket.security.JwtPrincipal;
import com.example.flightticket.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service = service; }
    @PostMapping
    public PaymentResponse pay(@AuthenticationPrincipal JwtPrincipal user, @Valid @RequestBody CreatePaymentRequest request) {
        return service.pay(user.username(), request.bookingId(), request.method());
    }
}
