package com.example.flightticket.repository;

import com.example.flightticket.entity.Payment;
import com.example.flightticket.entity.PaymentStatus;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByBookingId(Long bookingId);
    Optional<Payment> findByBookingId(Long bookingId);

    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(payment.amount), 0) FROM Payment payment WHERE payment.status = com.example.flightticket.entity.PaymentStatus.SUCCESS")
    BigDecimal totalSuccessfulRevenue();
}
