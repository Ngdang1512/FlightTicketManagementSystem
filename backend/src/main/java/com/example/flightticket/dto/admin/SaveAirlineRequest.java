package com.example.flightticket.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SaveAirlineRequest(@NotBlank @Size(max = 150) String name,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9]{2,3}$") String iataCode,
        @Size(max = 100) String country,
        @Min(0) @Max(30) Integer cabinBaggageKg,
        @Min(0) @Max(100) Integer includedCheckedBaggageKg) {}
