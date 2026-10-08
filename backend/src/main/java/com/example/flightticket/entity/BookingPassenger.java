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
import java.time.Instant;
import java.math.BigDecimal;

@Entity
@Table(name = "booking_passengers")
public class BookingPassenger {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;
    @Column(name = "document_number", length = 30)
    private String documentNumber;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "seat_number", length = 10)
    private String seatNumber;
    @Column(name = "checked_baggage_kg", nullable = false)
    private Integer checkedBaggageKg = 0;
    @Column(name = "baggage_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal baggagePrice = BigDecimal.ZERO;

    protected BookingPassenger() {}
    public BookingPassenger(Booking booking, String fullName, String documentNumber, String seatNumber,
                            Integer checkedBaggageKg, BigDecimal baggagePrice) {
        this.booking = booking;
        this.fullName = fullName;
        this.documentNumber = documentNumber;
        this.seatNumber = seatNumber.trim().toUpperCase();
        this.checkedBaggageKg = checkedBaggageKg;
        this.baggagePrice = baggagePrice;
        this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getDocumentNumber() { return documentNumber; }
    public String getSeatNumber() { return seatNumber; }
    public Integer getCheckedBaggageKg() { return checkedBaggageKg; }
    public BigDecimal getBaggagePrice() { return baggagePrice; }
}
