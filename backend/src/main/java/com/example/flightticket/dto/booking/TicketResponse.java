package com.example.flightticket.dto.booking;

public record TicketResponse(Long id, String passengerName, String documentNumber,
                             String seatNumber, String electronicTicketCode, String status) {}
