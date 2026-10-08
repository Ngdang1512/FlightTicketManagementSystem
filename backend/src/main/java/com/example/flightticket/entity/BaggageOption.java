package com.example.flightticket.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "baggage_options", uniqueConstraints = @UniqueConstraint(columnNames = {"airline_id", "weight_kg"}))
public class BaggageOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "airline_id", nullable = false)
    private Airline airline;
    @Column(name = "weight_kg", nullable = false)
    private Integer weightKg;
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;
    @Column(nullable = false)
    private boolean active = true;

    protected BaggageOption() {}
    public BaggageOption(Airline airline, Integer weightKg, BigDecimal price) { update(airline, weightKg, price, true); }
    public void update(Airline airline, Integer weightKg, BigDecimal price, boolean active) {
        this.airline = airline; this.weightKg = weightKg; this.price = price; this.active = active;
    }
    public Long getId() { return id; }
    public Airline getAirline() { return airline; }
    public Integer getWeightKg() { return weightKg; }
    public BigDecimal getPrice() { return price; }
    public boolean isActive() { return active; }
}
