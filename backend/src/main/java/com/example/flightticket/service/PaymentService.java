package com.example.flightticket.service;

import com.example.flightticket.dto.payment.PaymentResponse;
import com.example.flightticket.entity.*;
import com.example.flightticket.exception.ConflictException;
import com.example.flightticket.repository.PaymentRepository;
import com.example.flightticket.repository.TicketRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final BookingService bookingService;
    private final PaymentRepository payments;
    private final TicketRepository tickets;
    public PaymentService(BookingService bookingService, PaymentRepository payments, TicketRepository tickets) {
        this.bookingService = bookingService; this.payments = payments; this.tickets = tickets;
    }

    @Transactional
    public PaymentResponse pay(String username, Long bookingId, PaymentMethod method) {
        Booking booking = bookingService.ownedBooking(username, bookingId);
        if (booking.getStatus() != BookingStatus.PENDING || payments.existsByBookingId(bookingId)) {
            throw new ConflictException("Booking is not payable");
        }
        Payment payment = payments.save(new Payment(booking, BookingService.code("TX"), method));
        List<Ticket> issued = booking.getPassengers().stream()
                .map(passenger -> new Ticket(booking, passenger, BookingService.code("ET")))
                .map(tickets::save).toList();
        booking.getTickets().addAll(issued);
        booking.markPaid();
        return new PaymentResponse(payment.getId(), bookingId, payment.getTransactionCode(), payment.getAmount(),
                payment.getMethod().name(), payment.getStatus().name(), payment.getPaidAt());
    }
}
