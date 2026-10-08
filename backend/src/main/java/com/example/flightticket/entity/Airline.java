package com.example.flightticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
@Entity
@Table(name = "airlines")
public class Airline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "iata_code", nullable = false, unique = true, length = 3)
    private String iataCode;

    @Column(length = 100)
    private String country;

    @Column(name = "cabin_baggage_kg", nullable = false)
    private Integer cabinBaggageKg = 7;

    @Column(name = "included_checked_baggage_kg", nullable = false)
    private Integer includedCheckedBaggageKg = 0;

    protected Airline() {
    }

    public Airline(String name, String iataCode, String country, Integer cabinBaggageKg, Integer includedCheckedBaggageKg) {
        update(name, iataCode, country, cabinBaggageKg, includedCheckedBaggageKg);
    }

    public void update(String name, String iataCode, String country, Integer cabinBaggageKg, Integer includedCheckedBaggageKg) {
        this.name = name.trim(); this.iataCode = iataCode.trim().toUpperCase();
        this.country = country == null || country.isBlank() ? null : country.trim();
        this.cabinBaggageKg = cabinBaggageKg;
        this.includedCheckedBaggageKg = includedCheckedBaggageKg;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIataCode() { return iataCode; }
    public String getCountry() { return country; }
    public Integer getCabinBaggageKg() { return cabinBaggageKg; }
    public Integer getIncludedCheckedBaggageKg() { return includedCheckedBaggageKg; }
}
