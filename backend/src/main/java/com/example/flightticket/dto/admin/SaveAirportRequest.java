package com.example.flightticket.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SaveAirportRequest(@NotBlank @Size(max = 200) String name,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{3}$") String iataCode,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String country,
        @NotBlank @Size(max = 50) String timezone) {}
