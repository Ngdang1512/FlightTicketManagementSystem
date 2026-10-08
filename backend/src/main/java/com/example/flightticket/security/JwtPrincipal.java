package com.example.flightticket.security;

import com.example.flightticket.entity.AccountRole;

public record JwtPrincipal(Long accountId, String username, AccountRole role) {
}
