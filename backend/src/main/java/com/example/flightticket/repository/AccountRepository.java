package com.example.flightticket.repository;

import com.example.flightticket.entity.Account;
import com.example.flightticket.entity.AccountRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @EntityGraph(attributePaths = "customer")
    Optional<Account> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = "customer")
    List<Account> findAllByRoleOrderByCreatedAtDesc(AccountRole role);
}
