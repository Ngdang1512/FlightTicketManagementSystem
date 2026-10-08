package com.example.flightticket.repository;

import com.example.flightticket.entity.Airline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AirlineRepository extends JpaRepository<Airline, Long> {}
