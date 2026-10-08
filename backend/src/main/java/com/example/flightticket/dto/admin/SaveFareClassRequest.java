package com.example.flightticket.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveFareClassRequest(@NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 50) String name,
        @Size(max = 300) String description) {}
