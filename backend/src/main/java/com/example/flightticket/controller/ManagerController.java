package com.example.flightticket.controller;

import com.example.flightticket.dto.admin.*;
import com.example.flightticket.dto.flight.FlightResponse;
import com.example.flightticket.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {
    private final AdminService service;

    public ManagerController(AdminService service) { this.service = service; }

    @GetMapping("/dashboard") public AdminDashboardResponse dashboard() { return service.dashboard(); }
    @GetMapping("/flights") public List<FlightResponse> flights() { return service.flights(); }
    @PostMapping("/flights") public FlightResponse createFlight(@Valid @RequestBody ManageFlightRequest request) {
        return service.createFlight(request);
    }
    @PutMapping("/flights/{id}") public FlightResponse updateFlight(@PathVariable Long id,
            @Valid @RequestBody ManageFlightRequest request) { return service.updateFlight(id, request); }
    @PatchMapping("/flights/{id}/status")
    public FlightResponse status(@PathVariable Long id, @Valid @RequestBody UpdateFlightStatusRequest request) {
        return service.updateFlightStatus(id, request.status());
    }
    @GetMapping("/bookings") public List<AdminBookingResponse> bookings() { return service.bookings(); }
    @GetMapping("/catalogs") public AdminCatalogResponse catalogs() { return service.catalogs(); }
    @PostMapping("/bookings/{id}/cancel")
    public AdminBookingResponse cancelBooking(@PathVariable Long id) { return service.cancelBooking(id); }
    @PostMapping("/bookings/{id}/refund")
    public AdminBookingResponse refundBooking(@PathVariable Long id) { return service.refundBooking(id); }
}
