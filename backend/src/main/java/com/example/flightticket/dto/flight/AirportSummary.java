package com.example.flightticket.dto.flight;

public record AirportSummary(
        Long id,
        String iataCode,
        String name,
        String city,
        String country,
        String timezone) {
}
