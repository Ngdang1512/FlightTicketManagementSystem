package com.example.flightticket.repository;

import com.example.flightticket.entity.Booking;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    @EntityGraph(attributePaths = {"flight", "flight.aircraft", "flight.aircraft.airline",
            "flight.departureAirport", "flight.arrivalAirport", "fareClass"})
    List<Booking> findByCustomerIdOrderByBookedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"flight", "flight.aircraft", "flight.aircraft.airline",
            "flight.departureAirport", "flight.arrivalAirport", "fareClass"})
    Optional<Booking> findDetailedByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = {"customer", "flight", "flight.departureAirport", "flight.arrivalAirport", "fareClass"})
    List<Booking> findAllByOrderByBookedAtDesc();

    long countByCustomerId(Long customerId);
    boolean existsByFareClassId(Long fareClassId);
}
