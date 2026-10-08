package com.example.flightticket.config;

import com.example.flightticket.entity.*;
import com.example.flightticket.repository.AccountRepository;
import com.example.flightticket.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final AccountRepository accounts;
    private final CustomerRepository customers;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;
    private final String staffUsername;
    private final String staffPassword;

    public AdminBootstrap(AccountRepository accounts, CustomerRepository customers, PasswordEncoder encoder,
                          @Value("${app.bootstrap-admin.username:}") String username,
                          @Value("${app.bootstrap-admin.password:}") String password,
                          @Value("${app.bootstrap-staff.username:}") String staffUsername,
                          @Value("${app.bootstrap-staff.password:}") String staffPassword) {
        this.accounts = accounts; this.customers = customers; this.encoder = encoder;
        this.username = username.trim().toLowerCase(); this.password = password;
        this.staffUsername = staffUsername.trim().toLowerCase(); this.staffPassword = staffPassword;
    }

    @Override @Transactional
    public void run(ApplicationArguments args) {
        create(username, password, "System Administrator", AccountRole.ADMIN);
        create(staffUsername, staffPassword, "Flight Manager", AccountRole.STAFF);
    }

    private void create(String login, String rawPassword, String fullName, AccountRole role) {
        if (login.isBlank() || rawPassword.isBlank() || accounts.existsByUsernameIgnoreCase(login)) return;
        Customer customer = customers.save(new Customer(fullName, login + "@local.test", null));
        accounts.save(new Account(customer, login, encoder.encode(rawPassword), role));
    }
}
