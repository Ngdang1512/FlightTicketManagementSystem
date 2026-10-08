package com.example.flightticket.controller;

import com.example.flightticket.dto.booking.*;
import com.example.flightticket.security.JwtPrincipal;
import com.example.flightticket.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;
    public BookingController(BookingService service) { this.service = service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@AuthenticationPrincipal JwtPrincipal user, @Valid @RequestBody CreateBookingRequest request) { return service.create(user.username(), request); }
    @GetMapping("/my-bookings")
    public List<BookingResponse> mine(@AuthenticationPrincipal JwtPrincipal user) { return service.mine(user.username()); }
    @GetMapping("/{id}")
    public BookingResponse get(@AuthenticationPrincipal JwtPrincipal user, @PathVariable("id") Long id) { return service.get(user.username(), id); }
    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(@AuthenticationPrincipal JwtPrincipal user, @PathVariable("id") Long id) { return service.cancel(user.username(), id); }
    @PostMapping("/{id}/request-refund")
    public BookingResponse requestRefund(@AuthenticationPrincipal JwtPrincipal user, @PathVariable("id") Long id) { return service.requestRefund(user.username(), id); }
}
