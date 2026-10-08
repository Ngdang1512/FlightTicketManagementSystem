package com.example.flightticket.controller;

import com.example.flightticket.dto.admin.*;
import com.example.flightticket.dto.flight.FlightResponse;
import com.example.flightticket.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }
    @GetMapping("/dashboard") public AdminDashboardResponse dashboard() { return service.dashboard(); }
    @GetMapping("/customers") public List<AdminCustomerResponse> customers() { return service.customerAccounts(); }
    @PatchMapping("/customers/{accountId}/status")
    public AdminCustomerResponse customerStatus(@PathVariable Long accountId,
            @Valid @RequestBody UpdateAccountStatusRequest request) {
        return service.updateCustomerStatus(accountId, request.status());
    }
    @GetMapping("/staff") public List<StaffAccountResponse> staff() { return service.staffAccounts(); }
    @PostMapping("/staff") public StaffAccountResponse createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return service.createStaff(request);
    }
    @PatchMapping("/staff/{accountId}/status")
    public StaffAccountResponse staffStatus(@PathVariable Long accountId,
            @Valid @RequestBody UpdateAccountStatusRequest request) {
        return service.updateStaffStatus(accountId, request.status());
    }
    @GetMapping("/catalogs") public AdminCatalogResponse catalogs() { return service.catalogs(); }
    @PostMapping("/airlines") public AdminCatalogResponse.AirlineItem createAirline(@Valid @RequestBody SaveAirlineRequest request) { return service.saveAirline(null, request); }
    @PutMapping("/airlines/{id}") public AdminCatalogResponse.AirlineItem updateAirline(@PathVariable Long id, @Valid @RequestBody SaveAirlineRequest request) { return service.saveAirline(id, request); }
    @DeleteMapping("/airlines/{id}") public void deleteAirline(@PathVariable Long id) { service.deleteAirline(id); }
    @PostMapping("/baggage-options") public AdminCatalogResponse.BaggageOptionItem createBaggageOption(@Valid @RequestBody SaveBaggageOptionRequest request) { return service.saveBaggageOption(null, request); }
    @PutMapping("/baggage-options/{id}") public AdminCatalogResponse.BaggageOptionItem updateBaggageOption(@PathVariable Long id, @Valid @RequestBody SaveBaggageOptionRequest request) { return service.saveBaggageOption(id, request); }
    @DeleteMapping("/baggage-options/{id}") public void deleteBaggageOption(@PathVariable Long id) { service.deleteBaggageOption(id); }
    @PostMapping("/airports") public AdminCatalogResponse.AirportItem createAirport(@Valid @RequestBody SaveAirportRequest request) { return service.saveAirport(null, request); }
    @PutMapping("/airports/{id}") public AdminCatalogResponse.AirportItem updateAirport(@PathVariable Long id, @Valid @RequestBody SaveAirportRequest request) { return service.saveAirport(id, request); }
    @DeleteMapping("/airports/{id}") public void deleteAirport(@PathVariable Long id) { service.deleteAirport(id); }
    @PostMapping("/aircraft") public AdminCatalogResponse.AircraftItem createAircraft(@Valid @RequestBody SaveAircraftRequest request) { return service.saveAircraft(null, request); }
    @PutMapping("/aircraft/{id}") public AdminCatalogResponse.AircraftItem updateAircraft(@PathVariable Long id, @Valid @RequestBody SaveAircraftRequest request) { return service.saveAircraft(id, request); }
    @DeleteMapping("/aircraft/{id}") public void deleteAircraft(@PathVariable Long id) { service.deleteAircraft(id); }
    @PostMapping("/fare-classes") public AdminCatalogResponse.FareClassItem createFareClass(@Valid @RequestBody SaveFareClassRequest request) { return service.saveFareClass(null, request); }
    @PutMapping("/fare-classes/{id}") public AdminCatalogResponse.FareClassItem updateFareClass(@PathVariable Long id, @Valid @RequestBody SaveFareClassRequest request) { return service.saveFareClass(id, request); }
    @DeleteMapping("/fare-classes/{id}") public void deleteFareClass(@PathVariable Long id) { service.deleteFareClass(id); }
}
