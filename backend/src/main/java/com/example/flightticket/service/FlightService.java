package com.example.flightticket.service;

import com.example.flightticket.dto.flight.AirportSummary;
import com.example.flightticket.dto.flight.FareResponse;
import com.example.flightticket.dto.flight.FlightResponse;
import com.example.flightticket.entity.Airport;
import com.example.flightticket.entity.Flight;
import com.example.flightticket.entity.FlightFare;
import com.example.flightticket.exception.ResourceNotFoundException;
import com.example.flightticket.repository.FlightRepository;
import com.example.flightticket.repository.BookingPassengerRepository;
import com.example.flightticket.repository.BaggageOptionRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class FlightService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final FlightRepository flightRepository;
    private final BookingPassengerRepository passengers;
    private final BaggageOptionRepository baggageOptions;

    public FlightService(FlightRepository flightRepository, BookingPassengerRepository passengers,
                         BaggageOptionRepository baggageOptions) {
        this.flightRepository = flightRepository;
        this.passengers = passengers;
        this.baggageOptions = baggageOptions;
    }

    public List<FlightResponse> search(
            String departure,
            String arrival,
            LocalDate date,
            int passengers) {
        String normalizedDeparture = departure.toUpperCase(Locale.ROOT);
        String normalizedArrival = arrival.toUpperCase(Locale.ROOT);
        Instant from = date.atStartOfDay(BUSINESS_ZONE).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant();

        return flightRepository.search(normalizedDeparture, normalizedArrival, from, to, passengers)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FlightResponse getById(Long id) {
        return flightRepository.findDetailedById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found: " + id));
    }

    public List<FlightResponse> upcomingDomestic(int passengers) {
        return flightRepository.findUpcomingDomestic(Instant.now(), passengers).stream()
                .limit(12)
                .map(this::toResponse)
                .toList();
    }

    public List<String> occupiedSeats(Long flightId) {
        if (!flightRepository.existsById(flightId)) throw new ResourceNotFoundException("Flight not found: " + flightId);
        return passengers.findActiveSeats(flightId);
    }

    public FlightResponse toResponse(Flight flight) {
        return new FlightResponse(
                flight.getId(),
                flight.getFlightNumber(),
                flight.getAircraft().getAirline().getName(),
                flight.getAircraft().getAirline().getIataCode(),
                flight.getAircraft().getModel(),
                flight.getAircraft().getSeatCapacity(),
                toAirportSummary(flight.getDepartureAirport()),
                toAirportSummary(flight.getArrivalAirport()),
                flight.getDepartureTime(),
                flight.getArrivalTime(),
                flight.getStatus(), flight.getFares().stream().map(this::toFareResponse).toList(),
                flight.getAircraft().getAirline().getCabinBaggageKg(),
                flight.getAircraft().getAirline().getIncludedCheckedBaggageKg(),
                baggageOptions.findByAirlineIdAndActiveTrueOrderByWeightKgAsc(flight.getAircraft().getAirline().getId())
                        .stream().map(item -> new FlightResponse.BaggageOptionResponse(
                                item.getId(), item.getWeightKg(), item.getPrice())).toList());
    }

    private AirportSummary toAirportSummary(Airport airport) {
        return new AirportSummary(
                airport.getId(),
                airport.getIataCode(),
                airport.getName(),
                airport.getCity(),
                airport.getCountry(),
                airport.getTimezone());
    }

    private FareResponse toFareResponse(FlightFare fare) {
        return new FareResponse(
                fare.getId(),
                fare.getFareClass().getCode(),
                fare.getFareClass().getName(),
                fare.getPrice(),
                fare.getSeatQuota(),
                fare.getAvailableSeats());
    }
}
