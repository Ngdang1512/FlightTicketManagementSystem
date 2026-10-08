package com.example.flightticket.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record PassengerRequest(
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 30) String documentNumber,
        @NotBlank @Pattern(regexp = "^[1-9][0-9]?[A-F]$") String seatNumber,
        Long baggageOptionId) {}
