package com.example.flightticket.controller;

import com.example.flightticket.dto.flight.FlightResponse;
import com.example.flightticket.service.FlightService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping("/search")
    public List<FlightResponse> search(
            @RequestParam("departure") @Pattern(regexp = "(?i)^[A-Z]{3}$") String departure,
            @RequestParam("arrival") @Pattern(regexp = "(?i)^[A-Z]{3}$") String arrival,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "passengers", defaultValue = "1") @Min(1) @Max(9) int passengers) {
        return flightService.search(departure, arrival, date, passengers);
    }

    @GetMapping("/{id}")
    public FlightResponse getById(@PathVariable("id") @Min(1) Long id) {
        return flightService.getById(id);
    }

    @GetMapping("/{id}/occupied-seats")
    public List<String> occupiedSeats(@PathVariable("id") @Min(1) Long id) {
        return flightService.occupiedSeats(id);
    }

    @GetMapping("/upcoming")
    public List<FlightResponse> upcoming(
            @RequestParam(name = "passengers", defaultValue = "1") @Min(1) @Max(9) int passengers) {
        return flightService.upcomingDomestic(passengers);
    }
}
