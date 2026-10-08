package com.example.flightticket.dto.flight;

import com.example.flightticket.entity.FlightStatus;
import java.time.Instant;
import java.util.List;
import java.math.BigDecimal;

public record FlightResponse(
        Long id,
        String flightNumber,
        String airlineName,
        String airlineCode,
        String aircraftModel,
        Integer aircraftSeatCapacity,
        AirportSummary departureAirport,
        AirportSummary arrivalAirport,
        Instant departureTime,
        Instant arrivalTime,
        FlightStatus status,
        List<FareResponse> fares,
        Integer cabinBaggageKg,
        Integer includedCheckedBaggageKg,
        List<BaggageOptionResponse> baggageOptions) {
    public record BaggageOptionResponse(Long id, Integer weightKg, BigDecimal price) {}
}
