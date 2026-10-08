package com.example.flightticket.dto.admin;

import java.math.BigDecimal;

public record AdminDashboardResponse(long flights, long bookings, long customers,
                                     long successfulPayments, BigDecimal revenue) {}
