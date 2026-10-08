package com.example.flightticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
@Entity
@Table(name = "airports")
public class Airport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "iata_code", nullable = false, unique = true, length = 3)
    private String iataCode;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String country;

    @Column(nullable = false, length = 50)
    private String timezone;

    protected Airport() {
    }

    public Airport(String name, String iataCode, String city, String country, String timezone) {
        update(name, iataCode, city, country, timezone);
    }

    public void update(String name, String iataCode, String city, String country, String timezone) {
        this.name = name.trim(); this.iataCode = iataCode.trim().toUpperCase(); this.city = city.trim();
        this.country = country.trim(); this.timezone = timezone.trim();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIataCode() { return iataCode; }
    public String getCity() { return city; }
    public String getCountry() { return country; }
    public String getTimezone() { return timezone; }
}
