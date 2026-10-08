package com.example.flightticket.dto.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateBookingRequest(
        @NotNull Long flightId,
        @NotNull Long fareId,
        @NotEmpty @Size(max = 9) List<@Valid PassengerRequest> passengers) {}
