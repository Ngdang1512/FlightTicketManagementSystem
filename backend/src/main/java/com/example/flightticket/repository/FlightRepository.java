package com.example.flightticket.repository;

import com.example.flightticket.entity.Flight;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

public interface FlightRepository extends JpaRepository<Flight, Long> {
    boolean existsByAircraftId(Long aircraftId);
    boolean existsByDepartureAirportIdOrArrivalAirportId(Long departureAirportId, Long arrivalAirportId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT flight FROM Flight flight WHERE flight.id = :id")
    Optional<Flight> findByIdForSeatSelection(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT flight
            FROM Flight flight
            JOIN FETCH flight.aircraft aircraft
            JOIN FETCH aircraft.airline
            JOIN FETCH flight.departureAirport
            JOIN FETCH flight.arrivalAirport
            JOIN FETCH flight.fares fare
            JOIN FETCH fare.fareClass
            WHERE UPPER(flight.departureAirport.iataCode) = :departure
              AND UPPER(flight.arrivalAirport.iataCode) = :arrival
              AND UPPER(flight.departureAirport.country) IN ('VIETNAM', 'VIỆT NAM')
              AND UPPER(flight.arrivalAirport.country) IN ('VIETNAM', 'VIỆT NAM')
              AND flight.departureTime >= :from
              AND flight.departureTime < :to
              AND flight.status IN (com.example.flightticket.entity.FlightStatus.SCHEDULED,
                                    com.example.flightticket.entity.FlightStatus.DELAYED)
              AND fare.availableSeats >= :passengers
            ORDER BY flight.departureTime
            """)
    List<Flight> search(
            @Param("departure") String departure,
            @Param("arrival") String arrival,
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("passengers") int passengers);

    @Query("""
            SELECT DISTINCT flight
            FROM Flight flight
            JOIN FETCH flight.aircraft aircraft
            JOIN FETCH aircraft.airline
            JOIN FETCH flight.departureAirport
            JOIN FETCH flight.arrivalAirport
            JOIN FETCH flight.fares fare
            JOIN FETCH fare.fareClass
            WHERE flight.departureTime >= :now
              AND flight.status IN (com.example.flightticket.entity.FlightStatus.SCHEDULED,
                                    com.example.flightticket.entity.FlightStatus.DELAYED)
              AND UPPER(flight.departureAirport.country) IN ('VIETNAM', 'VIỆT NAM')
              AND UPPER(flight.arrivalAirport.country) IN ('VIETNAM', 'VIỆT NAM')
              AND fare.availableSeats >= :passengers
            ORDER BY flight.departureTime
            """)
    List<Flight> findUpcomingDomestic(@Param("now") Instant now, @Param("passengers") int passengers);

    @EntityGraph(attributePaths = {
        "aircraft",
        "aircraft.airline",
        "departureAirport",
        "arrivalAirport",
        "fares",
        "fares.fareClass"
    })
    Optional<Flight> findDetailedById(Long id);

    @EntityGraph(attributePaths = {
        "aircraft", "aircraft.airline", "departureAirport", "arrivalAirport", "fares", "fares.fareClass"
    })
    List<Flight> findAllByOrderByDepartureTimeDesc();
}
