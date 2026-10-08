package com.example.flightticket.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ManageFlightRequest(
        @NotBlank @Size(max = 20) String flightNumber,
        @NotNull Long aircraftId,
        @NotNull Long departureAirportId,
        @NotNull Long arrivalAirportId,
        @NotNull @Future Instant departureTime,
        @NotNull @Future Instant arrivalTime,
        @NotEmpty List<@Valid FareItem> fares) {
    public record FareItem(@NotNull Long fareClassId,
                           @NotNull @DecimalMin("0") BigDecimal price,
                           @NotNull @Min(1) Integer seatQuota) {}
}
