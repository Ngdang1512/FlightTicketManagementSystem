package com.example.flightticket.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "tickets")
public class Ticket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @Column(name = "passenger_name", nullable = false, length = 150) private String passengerName;
    @Column(name = "passenger_document", length = 30) private String passengerDocument;
    @Column(name = "seat_number", length = 10) private String seatNumber;
    @Column(name = "electronic_ticket_code", nullable = false, unique = true, length = 100) private String electronicTicketCode;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private TicketStatus status;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected Ticket() {}
    public Ticket(Booking booking, BookingPassenger passenger, String code) {
        this.booking = booking; this.passengerName = passenger.getFullName();
        this.passengerDocument = passenger.getDocumentNumber(); this.seatNumber = passenger.getSeatNumber(); this.electronicTicketCode = code;
        this.status = TicketStatus.ISSUED; this.createdAt = Instant.now(); this.updatedAt = createdAt;
    }
    public Long getId() { return id; }
    public String getPassengerName() { return passengerName; }
    public String getPassengerDocument() { return passengerDocument; }
    public String getSeatNumber() { return seatNumber; }
    public String getElectronicTicketCode() { return electronicTicketCode; }
    public TicketStatus getStatus() { return status; }
    public void voidTicket() { this.status = TicketStatus.VOID; this.updatedAt = Instant.now(); }
}
