package com.example.flightticket.repository;

import com.example.flightticket.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AirportRepository extends JpaRepository<Airport, Long> {}
