package com.example.flightticket.dto.admin;

import com.example.flightticket.entity.FlightStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateFlightStatusRequest(@NotNull FlightStatus status) {}
