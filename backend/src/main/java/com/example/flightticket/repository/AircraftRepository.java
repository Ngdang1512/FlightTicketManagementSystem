package com.example.flightticket.repository;

import com.example.flightticket.entity.Aircraft;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AircraftRepository extends JpaRepository<Aircraft, Long> {
    @EntityGraph(attributePaths = "airline")
    List<Aircraft> findAllByOrderByRegistrationNumberAsc();
    boolean existsByAirlineId(Long airlineId);
}
