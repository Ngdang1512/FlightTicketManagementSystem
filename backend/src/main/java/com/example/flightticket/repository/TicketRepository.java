package com.example.flightticket.repository;

import com.example.flightticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findAllByBookingId(Long bookingId);
}
