package com.example.flightticket.service;

import com.example.flightticket.dto.booking.*;
import com.example.flightticket.entity.*;
import com.example.flightticket.exception.ConflictException;
import com.example.flightticket.exception.ResourceNotFoundException;
import com.example.flightticket.repository.*;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.Period;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.HashSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private static final BigDecimal CHILD_FARE_RATE = new BigDecimal("0.75");
    private static final BigDecimal INFANT_FARE_RATE = new BigDecimal("0.10");
    private static final BigDecimal SENIOR_FARE_RATE = new BigDecimal("0.85");
    private static final Duration REFUND_CUTOFF = Duration.ofHours(24);
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
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
        request.passengers().forEach(item -> validatePassengerAge(item, fare.getFlight()));
        int quantity = request.passengers().size();
        HashSet<String> selectedSeats = new HashSet<>();
        request.passengers().forEach(item -> {
            if ("INFANT".equals(item.passengerType())) return;
            if (item.seatNumber() == null || item.seatNumber().isBlank()) throw new ConflictException("A seat is required for every passenger except infants");
            String seat = item.seatNumber().trim().toUpperCase(Locale.ROOT);
            if (!selectedSeats.add(seat)) throw new ConflictException("Seats must be unique");
            if (passengers.existsActiveSeat(request.flightId(), seat)) {
                throw new ConflictException("Seat " + seat + " is already selected");
            }
        });
        int seatQuantity = (int) request.passengers().stream().filter(item -> !"INFANT".equals(item.passengerType())).count();
        long infantCount = quantity - seatQuantity;
        long adultCount = request.passengers().stream().filter(item -> "ADULT".equals(item.passengerType())).count();
        long seniorCount = request.passengers().stream().filter(item -> "SENIOR".equals(item.passengerType())).count();
        if (infantCount > adultCount + seniorCount) throw new ConflictException("Each infant must travel with an adult");
        try { fare.reserveSeats(seatQuantity); }
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
        long childCount = request.passengers().stream().filter(item -> "CHILD".equals(item.passengerType())).count();
        BigDecimal adultFare = fare.getPrice().multiply(BigDecimal.valueOf(adultCount));
        BigDecimal seniorFare = fare.getPrice().multiply(SENIOR_FARE_RATE).multiply(BigDecimal.valueOf(seniorCount));
        BigDecimal childFare = fare.getPrice().multiply(CHILD_FARE_RATE).multiply(BigDecimal.valueOf(childCount));
        BigDecimal infantFare = fare.getPrice().multiply(INFANT_FARE_RATE).multiply(BigDecimal.valueOf(infantCount));
        BigDecimal total = adultFare.add(seniorFare).add(childFare).add(infantFare).add(baggageTotal);
        Booking booking = bookings.save(new Booking(code("BK"), account.getCustomer(), fare.getFlight(),
                fare.getFareClass(), quantity, seatQuantity, total, request.contactEmail().trim(), request.contactPhone().trim()));
        List<BookingPassenger> savedPassengers = java.util.stream.IntStream.range(0, quantity).mapToObj(index -> {
                    PassengerRequest item = request.passengers().get(index);
                    BaggageOption option = selectedBaggage.get(index);
                    BigDecimal passengerFare = switch (item.passengerType()) {
                        case "CHILD" -> fare.getPrice().multiply(CHILD_FARE_RATE);
                        case "INFANT" -> fare.getPrice().multiply(INFANT_FARE_RATE);
                        case "SENIOR" -> fare.getPrice().multiply(SENIOR_FARE_RATE);
                        default -> fare.getPrice();
                    };
                    return new BookingPassenger(booking, item.fullName().trim(), blank(item.documentNumber()), item.seatNumber(),
                            option == null ? 0 : option.getWeightKg(), option == null ? BigDecimal.ZERO : option.getPrice(),
                            item.passengerType(), passengerFare, item.dateOfBirth(), item.gender());
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
        fare.releaseSeats(booking.getSeatCount());
        booking.cancel();
        return response(booking);
    }

    @Transactional
    public BookingResponse requestRefund(String username, Long id) {
        Booking booking = ownedBooking(username, id);
        if (booking.getStatus() != BookingStatus.PAID) {
            throw new ConflictException("Only paid bookings can request a refund");
        }
        if (Instant.now().plus(REFUND_CUTOFF).isAfter(booking.getFlight().getDepartureTime())) {
            throw new ConflictException("Refund requests must be submitted at least 24 hours before departure");
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
                booking.getContactEmail(), booking.getContactPhone(),
                booking.getPassengers().stream().map(p -> new BookingResponse.PassengerDetail(p.getFullName(),
                        p.getDocumentNumber(), p.getSeatNumber(), p.getCheckedBaggageKg(), p.getBaggagePrice(),
                        p.getPassengerType(), p.getFareAmount(), p.getDateOfBirth(), p.getGender())).toList(),
                booking.getTickets().stream().map(t -> new TicketResponse(t.getId(), t.getPassengerName(),
                        t.getPassengerDocument(), t.getSeatNumber(), t.getElectronicTicketCode(), t.getStatus().name())).toList());
    }

    static String code(String prefix) { return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT); }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private void validatePassengerAge(PassengerRequest passenger, Flight flight) {
        var flightDate = flight.getDepartureTime().atZone(VIETNAM_ZONE).toLocalDate();
        if (passenger.dateOfBirth().isAfter(flightDate)) throw new ConflictException("Date of birth cannot be after the flight date");
        int age = Period.between(passenger.dateOfBirth(), flightDate).getYears();
        boolean valid = switch (passenger.passengerType()) {
            case "INFANT" -> age < 2;
            case "CHILD" -> age >= 2 && age < 12;
            case "ADULT" -> age >= 12 && age < 60;
            case "SENIOR" -> age >= 60;
            default -> false;
        };
        if (!valid) throw new ConflictException("Passenger category does not match date of birth");
    }
}
