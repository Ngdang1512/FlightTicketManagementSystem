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
import jakarta.persistence.Version;
import java.math.BigDecimal;
@Entity
@Table(name = "flight_fares")
public class FlightFare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fare_class_id", nullable = false)
    private FareClass fareClass;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(name = "seat_quota", nullable = false)
    private Integer seatQuota;

    @Column(name = "available_seats", nullable = false)
    private Integer availableSeats;

    @Version
    @Column(nullable = false)
    private Long version;

    protected FlightFare() {
    }

    public FlightFare(Flight flight, FareClass fareClass, BigDecimal price, Integer seatQuota) {
        this.flight = flight;
        this.fareClass = fareClass;
        this.price = price;
        this.seatQuota = seatQuota;
        this.availableSeats = seatQuota;
        this.version = 0L;
    }

    public Long getId() { return id; }
    public Flight getFlight() { return flight; }
    public FareClass getFareClass() { return fareClass; }
    public BigDecimal getPrice() { return price; }
    public Integer getSeatQuota() { return seatQuota; }
    public Integer getAvailableSeats() { return availableSeats; }
    public Long getVersion() { return version; }

    public void reserveSeats(int quantity) {
        if (quantity <= 0 || availableSeats < quantity) {
            throw new IllegalStateException("Not enough available seats");
        }
        availableSeats -= quantity;
    }

    public void releaseSeats(int quantity) {
        availableSeats = Math.min(seatQuota, availableSeats + quantity);
    }

    public void updateOffer(BigDecimal price, int newSeatQuota) {
        int soldSeats = seatQuota - availableSeats;
        if (newSeatQuota < soldSeats) throw new IllegalArgumentException("Seat quota cannot be lower than sold seats");
        this.price = price;
        this.seatQuota = newSeatQuota;
        this.availableSeats = newSeatQuota - soldSeats;
    }
}
