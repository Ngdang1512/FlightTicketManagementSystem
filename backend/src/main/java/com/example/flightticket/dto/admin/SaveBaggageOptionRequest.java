package com.example.flightticket.dto.admin;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SaveBaggageOptionRequest(@NotNull Long airlineId,
        @NotNull @Min(1) @Max(100) Integer weightKg,
        @NotNull @DecimalMin("0") BigDecimal price,
        Boolean active) {}
