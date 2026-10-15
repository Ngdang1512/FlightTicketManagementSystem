package com.example.flightticket.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PassengerRequest(
        @NotBlank @Size(max = 150) @Pattern(regexp = "^[A-Za-z ]+$", message = "Name must not contain diacritics") String fullName,
        @Size(max = 30) String documentNumber,
        @Pattern(regexp = "^[1-9][0-9]?[A-F]$") String seatNumber,
        Long baggageOptionId,
        @NotBlank @Pattern(regexp = "ADULT|SENIOR|CHILD|INFANT") String passengerType,
        @NotNull LocalDate dateOfBirth,
        @NotBlank @Pattern(regexp = "MALE|FEMALE|OTHER") String gender) {}
