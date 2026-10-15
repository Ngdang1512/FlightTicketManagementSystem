package com.example.flightticket.dto.booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record BookingResponse(
        Long id, String bookingCode, String status, Instant bookedAt, Instant expiresAt,
        String flightNumber, String airlineName, String departureCode, String arrivalCode,
        Instant departureTime, Instant arrivalTime, String fareClass, int passengerCount,
        BigDecimal totalAmount, String contactEmail, String contactPhone,
        List<PassengerDetail> passengers, List<TicketResponse> tickets) {
    public record PassengerDetail(String fullName, String documentNumber, String seatNumber,
                                  int checkedBaggageKg, BigDecimal baggagePrice, String passengerType,
                                  BigDecimal fareAmount, LocalDate dateOfBirth, String gender) {}
}
