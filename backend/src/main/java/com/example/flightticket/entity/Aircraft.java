package com.example.flightticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
@Entity
@Table(name = "aircraft")
public class Aircraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_number", nullable = false, unique = true, length = 20)
    private String registrationNumber;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "seat_capacity", nullable = false)
    private Integer seatCapacity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "airline_id", nullable = false)
    private Airline airline;

    protected Aircraft() {
    }

    public Aircraft(String registrationNumber, String model, Integer seatCapacity, Airline airline) {
        update(registrationNumber, model, seatCapacity, airline);
    }

    public void update(String registrationNumber, String model, Integer seatCapacity, Airline airline) {
        this.registrationNumber = registrationNumber.trim().toUpperCase(); this.model = model.trim();
        this.seatCapacity = seatCapacity; this.airline = airline;
    }

    public Long getId() { return id; }
    public String getRegistrationNumber() { return registrationNumber; }
    public String getModel() { return model; }
    public Integer getSeatCapacity() { return seatCapacity; }
    public Airline getAirline() { return airline; }
}
