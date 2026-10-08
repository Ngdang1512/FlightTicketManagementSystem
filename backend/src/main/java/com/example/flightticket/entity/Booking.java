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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 12)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fare_class_id", nullable = false)
    private FareClass fareClass;

    @Column(name = "booked_at", nullable = false)
    private Instant bookedAt;

    @Column(name = "passenger_count", nullable = false)
    private Integer passengerCount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "booking")
    private List<BookingPassenger> passengers = new ArrayList<>();

    @OneToMany(mappedBy = "booking")
    private List<Ticket> tickets = new ArrayList<>();

    protected Booking() {}

    public Booking(String bookingCode, Customer customer, Flight flight, FareClass fareClass,
                   int passengerCount, BigDecimal totalAmount) {
        Instant now = Instant.now();
        this.bookingCode = bookingCode;
        this.customer = customer;
        this.flight = flight;
        this.fareClass = fareClass;
        this.passengerCount = passengerCount;
        this.totalAmount = totalAmount;
        this.status = BookingStatus.PENDING;
        this.bookedAt = now;
        this.expiresAt = now.plusSeconds(15 * 60);
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void markPaid() { this.status = BookingStatus.PAID; this.updatedAt = Instant.now(); }
    public void requestRefund() { this.status = BookingStatus.REFUND_REQUESTED; this.updatedAt = Instant.now(); }
    public void markRefunded() { this.status = BookingStatus.REFUNDED; this.updatedAt = Instant.now(); }
    public void cancel() { this.status = BookingStatus.CANCELLED; this.updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public String getBookingCode() { return bookingCode; }
    public Customer getCustomer() { return customer; }
    public Flight getFlight() { return flight; }
    public FareClass getFareClass() { return fareClass; }
    public Instant getBookedAt() { return bookedAt; }
    public Integer getPassengerCount() { return passengerCount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BookingStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public List<BookingPassenger> getPassengers() { return passengers; }
    public List<Ticket> getTickets() { return tickets; }
}
