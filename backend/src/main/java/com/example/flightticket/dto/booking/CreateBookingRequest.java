package com.example.flightticket.dto.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateBookingRequest(
        @NotNull Long flightId,
        @NotNull Long fareId,
        @NotEmpty @Size(max = 9) List<@Valid PassengerRequest> passengers,
        @NotBlank @Email String contactEmail,
        @NotBlank @Pattern(regexp = "^[0-9+]{9,15}$") String contactPhone) {}
