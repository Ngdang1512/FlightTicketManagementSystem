package com.example.flightticket.service;

import com.example.flightticket.dto.booking.*;
import com.example.flightticket.entity.*;
import com.example.flightticket.exception.ConflictException;
import com.example.flightticket.exception.ResourceNotFoundException;
import com.example.flightticket.repository.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.HashSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final AccountRepository accounts;
    private final FlightFareRepository fares;
    private final BookingRepository bookings;
    private final BookingPassengerRepository passengers;
    private final FlightRepository flights;
    private final BaggageOptionRepository baggageOptions;

    public BookingService(AccountRepository accounts, FlightFareRepository fares,
                          BookingRepository bookings, BookingPassengerRepository passengers, FlightRepository flights,
                          BaggageOptionRepository baggageOptions) {
        this.accounts = accounts; this.fares = fares; this.bookings = bookings; this.passengers = passengers;
        this.flights = flights;
        this.baggageOptions = baggageOptions;
    }

    @Transactional
    public BookingResponse create(String username, CreateBookingRequest request) {
        Account account = activeAccount(username);
        flights.findByIdForSeatSelection(request.flightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
        FlightFare fare = fares.findByIdForUpdate(request.fareId())
                .orElseThrow(() -> new ResourceNotFoundException("Fare not found"));
        if (!fare.getFlight().getId().equals(request.flightId())) {
            throw new ConflictException("Fare does not belong to the selected flight");
        }
        int quantity = request.passengers().size();
        HashSet<String> selectedSeats = new HashSet<>();
        request.passengers().forEach(item -> {
            String seat = item.seatNumber().trim().toUpperCase(Locale.ROOT);
            if (!selectedSeats.add(seat)) throw new ConflictException("Seats must be unique");
            if (passengers.existsActiveSeat(request.flightId(), seat)) {
                throw new ConflictException("Seat " + seat + " is already selected");
            }
        });
        try { fare.reserveSeats(quantity); }
        catch (IllegalStateException exception) { throw new ConflictException("Not enough available seats"); }

        var selectedBaggage = request.passengers().stream().map(item -> {
            if (item.baggageOptionId() == null) return null;
            BaggageOption option = baggageOptions.findById(item.baggageOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Baggage option not found"));
            if (!option.isActive() || !option.getAirline().getId().equals(fare.getFlight().getAircraft().getAirline().getId())) {
                throw new ConflictException("Baggage option does not belong to the selected airline");
            }
            return option;
        }).toList();
        BigDecimal baggageTotal = selectedBaggage.stream().filter(java.util.Objects::nonNull)
                .map(BaggageOption::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = fare.getPrice().multiply(BigDecimal.valueOf(quantity)).add(baggageTotal);
        Booking booking = bookings.save(new Booking(code("BK"), account.getCustomer(), fare.getFlight(),
                fare.getFareClass(), quantity, total));
        List<BookingPassenger> savedPassengers = java.util.stream.IntStream.range(0, quantity).mapToObj(index -> {
                    PassengerRequest item = request.passengers().get(index);
                    BaggageOption option = selectedBaggage.get(index);
                    return new BookingPassenger(booking, item.fullName().trim(), blank(item.documentNumber()), item.seatNumber(),
                            option == null ? 0 : option.getWeightKg(), option == null ? BigDecimal.ZERO : option.getPrice());
                }).map(passengers::save).toList();
        booking.getPassengers().addAll(savedPassengers);
        return response(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> mine(String username) {
        Account account = activeAccount(username);
        return bookings.findByCustomerIdOrderByBookedAtDesc(account.getCustomer().getId())
                .stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse get(String username, Long id) {
        return response(ownedBooking(username, id));
    }

    @Transactional
    public BookingResponse cancel(String username, Long id) {
        Booking booking = ownedBooking(username, id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be cancelled");
        }
        FlightFare fare = fares.findForUpdate(booking.getFlight().getId(), booking.getFareClass().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fare not found"));
        fare.releaseSeats(booking.getPassengerCount());
        booking.cancel();
        return response(booking);
    }

    @Transactional
    public BookingResponse requestRefund(String username, Long id) {
        Booking booking = ownedBooking(username, id);
        if (booking.getStatus() != BookingStatus.PAID) {
            throw new ConflictException("Only paid bookings can request a refund");
        }
        if (booking.getFlight().getStatus() == FlightStatus.DEPARTED
                || booking.getFlight().getStatus() == FlightStatus.ARRIVED) {
            throw new ConflictException("Departed flights cannot be refunded");
        }
        booking.requestRefund();
        return response(booking);
    }

    Booking ownedBooking(String username, Long id) {
        Account account = activeAccount(username);
        return bookings.findDetailedByIdAndCustomerId(id, account.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    Account activeAccount(String username) {
        return accounts.findByUsernameIgnoreCase(username)
                .filter(account -> account.getStatus() == AccountStatus.ACTIVE && account.getCustomer() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    BookingResponse response(Booking booking) {
        Flight flight = booking.getFlight();
        return new BookingResponse(booking.getId(), booking.getBookingCode(), booking.getStatus().name(),
                booking.getBookedAt(), booking.getExpiresAt(), flight.getFlightNumber(),
                flight.getAircraft().getAirline().getName(), flight.getDepartureAirport().getIataCode(),
                flight.getArrivalAirport().getIataCode(), flight.getDepartureTime(), flight.getArrivalTime(),
                booking.getFareClass().getName(), booking.getPassengerCount(), booking.getTotalAmount(),
                booking.getPassengers().stream().map(p -> new BookingResponse.PassengerDetail(p.getFullName(),
                        p.getDocumentNumber(), p.getSeatNumber(), p.getCheckedBaggageKg(), p.getBaggagePrice())).toList(),
                booking.getTickets().stream().map(t -> new TicketResponse(t.getId(), t.getPassengerName(),
                        t.getPassengerDocument(), t.getSeatNumber(), t.getElectronicTicketCode(), t.getStatus().name())).toList());
    }

    static String code(String prefix) { return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT); }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
