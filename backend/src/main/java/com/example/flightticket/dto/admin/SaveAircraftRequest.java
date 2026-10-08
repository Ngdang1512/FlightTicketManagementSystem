package com.example.flightticket.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveAircraftRequest(@NotBlank @Size(max = 20) String registrationNumber,
        @NotBlank @Size(max = 100) String model,
        @NotNull @Min(1) Integer seatCapacity,
        @NotNull Long airlineId) {}
