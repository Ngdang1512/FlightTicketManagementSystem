package com.example.flightticket.service;

import com.example.flightticket.dto.admin.*;
import com.example.flightticket.dto.flight.FlightResponse;
import com.example.flightticket.entity.*;
import com.example.flightticket.exception.ResourceNotFoundException;
import com.example.flightticket.exception.ConflictException;
import com.example.flightticket.repository.*;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
    private final FlightRepository flights;
    private final BookingRepository bookings;
    private final CustomerRepository customers;
    private final AccountRepository accounts;
    private final PaymentRepository payments;
    private final FlightService flightService;
    private final FlightFareRepository fares;
    private final AirlineRepository airlines;
    private final AirportRepository airports;
    private final AircraftRepository aircraft;
    private final FareClassRepository fareClasses;
    private final PasswordEncoder passwordEncoder;
    private final TicketRepository tickets;
    private final BaggageOptionRepository baggageOptions;

    public AdminService(FlightRepository flights, BookingRepository bookings, CustomerRepository customers,
                        AccountRepository accounts, PaymentRepository payments, FlightService flightService,
                        FlightFareRepository fares, AirlineRepository airlines, AirportRepository airports,
                        AircraftRepository aircraft, FareClassRepository fareClasses, PasswordEncoder passwordEncoder,
                        TicketRepository tickets, BaggageOptionRepository baggageOptions) {
        this.flights = flights; this.bookings = bookings; this.customers = customers;
        this.accounts = accounts; this.payments = payments; this.flightService = flightService;
        this.fares = fares; this.airlines = airlines; this.airports = airports; this.aircraft = aircraft;
        this.fareClasses = fareClasses; this.passwordEncoder = passwordEncoder;
        this.tickets = tickets;
        this.baggageOptions = baggageOptions;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(flights.count(), bookings.count(), customers.count(),
                payments.countByStatus(PaymentStatus.SUCCESS), payments.totalSuccessfulRevenue());
    }

    @Transactional(readOnly = true)
    public List<FlightResponse> flights() {
        return flights.findAllByOrderByDepartureTimeDesc().stream().map(flightService::toResponse).toList();
    }

    @Transactional
    public FlightResponse updateFlightStatus(Long id, FlightStatus status) {
        Flight flight = flights.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
        flight.updateStatus(status);
        return flightService.toResponse(flight);
    }

    @Transactional
    public FlightResponse createFlight(ManageFlightRequest request) {
        Aircraft selectedAircraft = aircraft.findById(request.aircraftId())
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found"));
        Airport departure = airports.findById(request.departureAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Departure airport not found"));
        Airport arrival = airports.findById(request.arrivalAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Arrival airport not found"));
        long distinctClasses = request.fares().stream().map(ManageFlightRequest.FareItem::fareClassId).distinct().count();
        if (distinctClasses != request.fares().size()) throw new IllegalArgumentException("Fare classes must be unique");
        int totalQuota = request.fares().stream().mapToInt(ManageFlightRequest.FareItem::seatQuota).sum();
        if (totalQuota > selectedAircraft.getSeatCapacity()) {
            throw new IllegalArgumentException("Total seat quota exceeds aircraft capacity");
        }
        Flight flight = flights.save(new Flight(request.flightNumber(), selectedAircraft, departure, arrival,
                request.departureTime(), request.arrivalTime()));
        List<FlightFare> offers = request.fares().stream().map(item -> new FlightFare(flight,
                fareClasses.findById(item.fareClassId()).orElseThrow(() -> new ResourceNotFoundException("Fare class not found")),
                item.price(), item.seatQuota())).map(fares::save).toList();
        flight.getFares().addAll(offers);
        return flightService.toResponse(flight);
    }

    @Transactional
    public FlightResponse updateFlight(Long id, ManageFlightRequest request) {
        Flight flight = flights.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found"));
        if (flight.getStatus() != FlightStatus.SCHEDULED && flight.getStatus() != FlightStatus.DELAYED) {
            throw new ConflictException("Only scheduled or delayed flights can be edited");
        }
        Aircraft selectedAircraft = aircraft.findById(request.aircraftId())
                .orElseThrow(() -> new ResourceNotFoundException("Aircraft not found"));
        Airport departure = airports.findById(request.departureAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Departure airport not found"));
        Airport arrival = airports.findById(request.arrivalAirportId())
                .orElseThrow(() -> new ResourceNotFoundException("Arrival airport not found"));
        Map<Long, FlightFare> existing = fares.findAllByFlightId(id).stream()
                .collect(Collectors.toMap(item -> item.getFareClass().getId(), Function.identity()));
        long distinctClasses = request.fares().stream().map(ManageFlightRequest.FareItem::fareClassId).distinct().count();
        if (distinctClasses != request.fares().size()) throw new IllegalArgumentException("Fare classes must be unique");
        Map<Long, Integer> requestedQuota = request.fares().stream().collect(Collectors.toMap(
                ManageFlightRequest.FareItem::fareClassId, ManageFlightRequest.FareItem::seatQuota));
        List<FlightFare> removedOffers = existing.entrySet().stream()
                .filter(entry -> !requestedQuota.containsKey(entry.getKey())).map(Map.Entry::getValue).toList();
        if (removedOffers.stream().anyMatch(item -> !item.getAvailableSeats().equals(item.getSeatQuota()))) {
            throw new ConflictException("Fare classes with sold seats cannot be removed");
        }
        fares.deleteAll(removedOffers);
        flight.getFares().removeAll(removedOffers);
        int totalQuota = request.fares().stream().mapToInt(ManageFlightRequest.FareItem::seatQuota).sum();
        if (totalQuota > selectedAircraft.getSeatCapacity()) throw new IllegalArgumentException("Total seat quota exceeds aircraft capacity");
        flight.updateSchedule(request.flightNumber(), selectedAircraft, departure, arrival,
                request.departureTime(), request.arrivalTime());
        for (ManageFlightRequest.FareItem item : request.fares()) {
            FlightFare offer = existing.get(item.fareClassId());
            if (offer == null) {
                FareClass fareClass = fareClasses.findById(item.fareClassId())
                        .orElseThrow(() -> new ResourceNotFoundException("Fare class not found"));
                flight.getFares().add(fares.save(new FlightFare(flight, fareClass, item.price(), item.seatQuota())));
            } else {
                offer.updateOffer(item.price(), item.seatQuota());
            }
        }
        return flightService.toResponse(flight);
    }

    @Transactional(readOnly = true)
    public List<AdminBookingResponse> bookings() {
        return bookings.findAllByOrderByBookedAtDesc().stream().map(this::bookingResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminCustomerResponse> customerAccounts() {
        return accounts.findAllByRoleOrderByCreatedAtDesc(AccountRole.USER).stream()
                .map(this::customerResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StaffAccountResponse> staffAccounts() {
        return accounts.findAllByRoleOrderByCreatedAtDesc(AccountRole.STAFF).stream()
                .map(this::staffResponse).toList();
    }

    @Transactional
    public StaffAccountResponse createStaff(CreateStaffRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (accounts.existsByUsernameIgnoreCase(username)) throw new ConflictException("Username already exists");
        if (customers.existsByEmailIgnoreCase(email)) throw new ConflictException("Email already exists");
        Customer profile = customers.save(new Customer(request.fullName().trim(), email, null));
        Account account = accounts.save(new Account(profile, username,
                passwordEncoder.encode(request.password()), AccountRole.STAFF));
        return staffResponse(account);
    }

    @Transactional
    public StaffAccountResponse updateStaffStatus(Long accountId, AccountStatus status) {
        if (status == AccountStatus.DELETED) throw new IllegalArgumentException("Staff accounts can only be ACTIVE or LOCKED");
        Account account = accounts.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff account not found"));
        if (account.getRole() != AccountRole.STAFF) throw new IllegalArgumentException("Only staff accounts can be updated here");
        account.updateStatus(status);
        return staffResponse(account);
    }

    @Transactional(readOnly = true)
    public AdminCatalogResponse catalogs() {
        return new AdminCatalogResponse(
                airlines.findAll().stream().map(item -> new AdminCatalogResponse.AirlineItem(
                        item.getId(), item.getName(), item.getIataCode(), item.getCountry(),
                        item.getCabinBaggageKg(), item.getIncludedCheckedBaggageKg())).toList(),
                airports.findAll().stream().map(item -> new AdminCatalogResponse.AirportItem(
                        item.getId(), item.getName(), item.getIataCode(), item.getCity(), item.getCountry(), item.getTimezone())).toList(),
                aircraft.findAllByOrderByRegistrationNumberAsc().stream().map(item -> new AdminCatalogResponse.AircraftItem(
                        item.getId(), item.getRegistrationNumber(), item.getModel(), item.getSeatCapacity(),
                        item.getAirline().getId(), item.getAirline().getName())).toList(),
                fareClasses.findAll().stream().map(item -> new AdminCatalogResponse.FareClassItem(
                        item.getId(), item.getCode(), item.getName(), item.getDescription())).toList(),
                baggageOptions.findAllByOrderByAirlineNameAscWeightKgAsc().stream().map(item ->
                        new AdminCatalogResponse.BaggageOptionItem(item.getId(), item.getAirline().getId(),
                                item.getAirline().getName(), item.getWeightKg(), item.getPrice(), item.isActive())).toList());
    }

    @Transactional
    public AdminCatalogResponse.AirlineItem saveAirline(Long id, SaveAirlineRequest request) {
        int cabinKg = request.cabinBaggageKg() == null ? 7 : request.cabinBaggageKg();
        int checkedKg = request.includedCheckedBaggageKg() == null ? 0 : request.includedCheckedBaggageKg();
        Airline item = id == null ? new Airline(request.name(), request.iataCode(), request.country(), cabinKg, checkedKg)
                : airlines.findById(id).orElseThrow(() -> new ResourceNotFoundException("Airline not found"));
        if (id != null) item.update(request.name(), request.iataCode(), request.country(), cabinKg, checkedKg);
        item = airlines.save(item);
        return new AdminCatalogResponse.AirlineItem(item.getId(), item.getName(), item.getIataCode(), item.getCountry(),
                item.getCabinBaggageKg(), item.getIncludedCheckedBaggageKg());
    }

    @Transactional
    public void deleteAirline(Long id) {
        if (!airlines.existsById(id)) throw new ResourceNotFoundException("Airline not found");
        if (aircraft.existsByAirlineId(id) || baggageOptions.existsByAirlineId(id)) throw new ConflictException("Airline is in use");
        airlines.deleteById(id);
    }

    @Transactional
    public AdminCatalogResponse.BaggageOptionItem saveBaggageOption(Long id, SaveBaggageOptionRequest request) {
        Airline airline = airlines.findById(request.airlineId()).orElseThrow(() -> new ResourceNotFoundException("Airline not found"));
        BaggageOption item = id == null ? new BaggageOption(airline, request.weightKg(), request.price())
                : baggageOptions.findById(id).orElseThrow(() -> new ResourceNotFoundException("Baggage option not found"));
        if (id != null) item.update(airline, request.weightKg(), request.price(), request.active() == null || request.active());
        item = baggageOptions.save(item);
        return new AdminCatalogResponse.BaggageOptionItem(item.getId(), airline.getId(), airline.getName(),
                item.getWeightKg(), item.getPrice(), item.isActive());
    }

    @Transactional
    public void deleteBaggageOption(Long id) {
        if (!baggageOptions.existsById(id)) throw new ResourceNotFoundException("Baggage option not found");
        baggageOptions.deleteById(id);
    }

    @Transactional
    public AdminCatalogResponse.AirportItem saveAirport(Long id, SaveAirportRequest request) {
        Airport item = id == null ? new Airport(request.name(), request.iataCode(), request.city(), request.country(), request.timezone())
                : airports.findById(id).orElseThrow(() -> new ResourceNotFoundException("Airport not found"));
        if (id != null) item.update(request.name(), request.iataCode(), request.city(), request.country(), request.timezone());
        item = airports.save(item);
        return new AdminCatalogResponse.AirportItem(item.getId(), item.getName(), item.getIataCode(), item.getCity(), item.getCountry(), item.getTimezone());
    }

    @Transactional
    public void deleteAirport(Long id) {
        if (!airports.existsById(id)) throw new ResourceNotFoundException("Airport not found");
        if (flights.existsByDepartureAirportIdOrArrivalAirportId(id, id)) throw new ConflictException("Airport is used by flights");
        airports.deleteById(id);
    }

    @Transactional
    public AdminCatalogResponse.AircraftItem saveAircraft(Long id, SaveAircraftRequest request) {
        Airline airline = airlines.findById(request.airlineId()).orElseThrow(() -> new ResourceNotFoundException("Airline not found"));
        Aircraft item = id == null ? new Aircraft(request.registrationNumber(), request.model(), request.seatCapacity(), airline)
                : aircraft.findById(id).orElseThrow(() -> new ResourceNotFoundException("Aircraft not found"));
        if (id != null) item.update(request.registrationNumber(), request.model(), request.seatCapacity(), airline);
        item = aircraft.save(item);
        return new AdminCatalogResponse.AircraftItem(item.getId(), item.getRegistrationNumber(), item.getModel(),
                item.getSeatCapacity(), airline.getId(), airline.getName());
    }

    @Transactional
    public void deleteAircraft(Long id) {
        if (!aircraft.existsById(id)) throw new ResourceNotFoundException("Aircraft not found");
        if (flights.existsByAircraftId(id)) throw new ConflictException("Aircraft is used by flights");
        aircraft.deleteById(id);
    }

    @Transactional
    public AdminCatalogResponse.FareClassItem saveFareClass(Long id, SaveFareClassRequest request) {
        FareClass item = id == null ? new FareClass(request.code(), request.name(), request.description())
                : fareClasses.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fare class not found"));
        if (id != null) item.update(request.code(), request.name(), request.description());
        item = fareClasses.save(item);
        return new AdminCatalogResponse.FareClassItem(item.getId(), item.getCode(), item.getName(), item.getDescription());
    }

    @Transactional
    public void deleteFareClass(Long id) {
        if (!fareClasses.existsById(id)) throw new ResourceNotFoundException("Fare class not found");
        if (fares.existsByFareClassId(id) || bookings.existsByFareClassId(id)) throw new ConflictException("Fare class is in use");
        fareClasses.deleteById(id);
    }

    @Transactional
    public AdminCustomerResponse updateCustomerStatus(Long accountId, AccountStatus status) {
        if (status == AccountStatus.DELETED) {
            throw new IllegalArgumentException("Customer accounts can only be ACTIVE or LOCKED");
        }
        Account account = accounts.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (account.getRole() != AccountRole.USER || account.getCustomer() == null) {
            throw new IllegalArgumentException("Only customer accounts can be updated here");
        }
        account.updateStatus(status);
        return customerResponse(account);
    }

    @Transactional
    public AdminBookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be cancelled by the manager");
        }
        FlightFare fare = fares.findForUpdate(booking.getFlight().getId(), booking.getFareClass().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fare not found"));
        fare.releaseSeats(booking.getPassengerCount());
        booking.cancel();
        return bookingResponse(booking);
    }

    @Transactional
    public AdminBookingResponse refundBooking(Long bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.REFUND_REQUESTED) {
            throw new ConflictException("Only paid bookings or refund requests can be refunded");
        }
        if (booking.getFlight().getStatus() == FlightStatus.DEPARTED
                || booking.getFlight().getStatus() == FlightStatus.ARRIVED) {
            throw new ConflictException("Departed flights cannot be refunded");
        }
        Payment payment = payments.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        FlightFare fare = fares.findForUpdate(booking.getFlight().getId(), booking.getFareClass().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fare not found"));
        fare.releaseSeats(booking.getPassengerCount());
        tickets.findAllByBookingId(bookingId).forEach(Ticket::voidTicket);
        payment.refund();
        booking.markRefunded();
        return bookingResponse(booking);
    }

    private AdminBookingResponse bookingResponse(Booking booking) {
        Customer customer = booking.getCustomer();
        return new AdminBookingResponse(booking.getId(), booking.getBookingCode(), customer.getFullName(),
                customer.getEmail(), booking.getFlight().getDepartureAirport().getIataCode() + " → "
                + booking.getFlight().getArrivalAirport().getIataCode(), booking.getFlight().getFlightNumber(),
                booking.getPassengerCount(), booking.getTotalAmount(), booking.getStatus().name(), booking.getBookedAt());
    }

    private AdminCustomerResponse customerResponse(Account account) {
        Customer customer = account.getCustomer();
        return new AdminCustomerResponse(account.getId(), customer.getId(), account.getUsername(),
                customer.getFullName(), customer.getEmail(), customer.getPhone(), account.getStatus().name(),
                bookings.countByCustomerId(customer.getId()), account.getCreatedAt());
    }

    private StaffAccountResponse staffResponse(Account account) {
        Customer profile = account.getCustomer();
        return new StaffAccountResponse(account.getId(), account.getUsername(),
                profile == null ? account.getUsername() : profile.getFullName(),
                profile == null ? null : profile.getEmail(), account.getStatus().name(), account.getCreatedAt());
    }
}
