package com.example.flightticket.repository;

import com.example.flightticket.entity.FlightFare;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlightFareRepository extends JpaRepository<FlightFare, Long> {
    List<FlightFare> findAllByFlightId(Long flightId);
    boolean existsByFareClassId(Long fareClassId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT fare FROM FlightFare fare
            JOIN FETCH fare.flight flight
            JOIN FETCH flight.aircraft aircraft
            JOIN FETCH aircraft.airline
            JOIN FETCH flight.departureAirport
            JOIN FETCH flight.arrivalAirport
            JOIN FETCH fare.fareClass
            WHERE fare.id = :id
            """)
    Optional<FlightFare> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT fare FROM FlightFare fare WHERE fare.flight.id = :flightId AND fare.fareClass.id = :classId")
    Optional<FlightFare> findForUpdate(@Param("flightId") Long flightId, @Param("classId") Long classId);
}
