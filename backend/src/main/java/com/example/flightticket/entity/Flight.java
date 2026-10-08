package com.example.flightticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "flights")
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "flight_number", nullable = false, length = 20)
    private String flightNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aircraft_id", nullable = false)
    private Aircraft aircraft;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "departure_airport_id", nullable = false)
    private Airport departureAirport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "arrival_airport_id", nullable = false)
    private Airport arrivalAirport;

    @Column(name = "departure_time", nullable = false)
    private Instant departureTime;

    @Column(name = "arrival_time", nullable = false)
    private Instant arrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FlightStatus status;

    @OrderBy("price ASC")
    @OneToMany(mappedBy = "flight", fetch = FetchType.LAZY)
    private List<FlightFare> fares = new ArrayList<>();

    protected Flight() {
    }

    public Flight(String flightNumber, Aircraft aircraft, Airport departureAirport, Airport arrivalAirport,
                  Instant departureTime, Instant arrivalTime) {
        updateSchedule(flightNumber, aircraft, departureAirport, arrivalAirport, departureTime, arrivalTime);
        this.status = FlightStatus.SCHEDULED;
    }

    public Long getId() { return id; }
    public String getFlightNumber() { return flightNumber; }
    public Aircraft getAircraft() { return aircraft; }
    public Airport getDepartureAirport() { return departureAirport; }
    public Airport getArrivalAirport() { return arrivalAirport; }
    public Instant getDepartureTime() { return departureTime; }
    public Instant getArrivalTime() { return arrivalTime; }
    public FlightStatus getStatus() { return status; }
    public List<FlightFare> getFares() { return fares; }

    public void updateStatus(FlightStatus status) { this.status = status; }

    public void updateSchedule(String flightNumber, Aircraft aircraft, Airport departureAirport,
                               Airport arrivalAirport, Instant departureTime, Instant arrivalTime) {
        if (departureAirport.getId().equals(arrivalAirport.getId())) {
            throw new IllegalArgumentException("Departure and arrival airports must be different");
        }
        if (!arrivalTime.isAfter(departureTime)) {
            throw new IllegalArgumentException("Arrival time must be after departure time");
        }
        this.flightNumber = flightNumber.trim().toUpperCase();
        this.aircraft = aircraft;
        this.departureAirport = departureAirport;
        this.arrivalAirport = arrivalAirport;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
    }
}
