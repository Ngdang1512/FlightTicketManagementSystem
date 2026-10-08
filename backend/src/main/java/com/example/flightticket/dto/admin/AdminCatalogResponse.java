package com.example.flightticket.dto.admin;

import java.util.List;

public record AdminCatalogResponse(List<AirlineItem> airlines, List<AirportItem> airports,
                                   List<AircraftItem> aircraft, List<FareClassItem> fareClasses,
                                   List<BaggageOptionItem> baggageOptions) {
    public record AirlineItem(Long id, String name, String iataCode, String country,
                              Integer cabinBaggageKg, Integer includedCheckedBaggageKg) {}
    public record AirportItem(Long id, String name, String iataCode, String city, String country, String timezone) {}
    public record AircraftItem(Long id, String registrationNumber, String model, Integer seatCapacity,
                               Long airlineId, String airlineName) {}
    public record FareClassItem(Long id, String code, String name, String description) {}
    public record BaggageOptionItem(Long id, Long airlineId, String airlineName,
                                    Integer weightKg, java.math.BigDecimal price, boolean active) {}
}
