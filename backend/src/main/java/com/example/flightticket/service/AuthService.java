package com.example.flightticket.service;

import com.example.flightticket.dto.auth.AuthResponse;
import com.example.flightticket.dto.auth.AuthUserResponse;
import com.example.flightticket.dto.auth.RegisterRequest;
import com.example.flightticket.entity.Account;
import com.example.flightticket.entity.AccountStatus;
import com.example.flightticket.entity.Customer;
import com.example.flightticket.exception.ConflictException;
import com.example.flightticket.exception.UnauthorizedException;
import com.example.flightticket.repository.AccountRepository;
import com.example.flightticket.repository.CustomerRepository;
import com.example.flightticket.security.JwtPrincipal;
import com.example.flightticket.security.JwtService;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            AccountRepository accountRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = normalize(request.username());
        String email = normalize(request.email());
        String phone = blankToNull(request.phone());
        if (accountRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Username is already in use");
        }
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email is already in use");
        }
        if (phone != null && customerRepository.existsByPhone(phone)) {
            throw new ConflictException("Phone number is already in use");
        }

        Customer customer = customerRepository.save(
                new Customer(request.fullName().trim(), email, phone));
        Account account = accountRepository.save(
                new Account(customer, username, passwordEncoder.encode(request.password())));
        return createResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String username, String password) throws AuthenticationException {
        String normalizedUsername = normalize(username);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedUsername, password));
        Account account = requireActiveAccount(normalizedUsername);
        return createResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        JwtPrincipal principal = jwtService.parseRefreshToken(refreshToken);
        Account account = requireActiveAccount(principal.username());
        if (!account.getId().equals(principal.accountId())) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        return createResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(String username) {
        return toUserResponse(requireActiveAccount(username));
    }

    private Account requireActiveAccount(String username) {
        Account account = accountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid account"));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }
        return account;
    }

    private AuthResponse createResponse(Account account) {
        return new AuthResponse(
                "Bearer",
                jwtService.createAccessToken(account),
                jwtService.getAccessTokenExpiresInSeconds(),
                jwtService.createRefreshToken(account),
                jwtService.getRefreshTokenExpiresInSeconds(),
                toUserResponse(account));
    }

    private AuthUserResponse toUserResponse(Account account) {
        Customer customer = account.getCustomer();
        return new AuthUserResponse(
                account.getId(),
                customer == null ? null : customer.getId(),
                account.getUsername(),
                customer == null ? null : customer.getFullName(),
                customer == null ? null : customer.getEmail(),
                account.getRole().name());
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
