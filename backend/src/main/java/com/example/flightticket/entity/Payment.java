package com.example.flightticket.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "booking_id") private Booking booking;
    @Column(name = "transaction_code", unique = true, length = 100) private String transactionCode;
    @Column(name = "paid_at") private Instant paidAt;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private PaymentMethod method;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private PaymentStatus status;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected Payment() {}
    public Payment(Booking booking, String transactionCode, PaymentMethod method) {
        this.booking = booking; this.transactionCode = transactionCode; this.method = method;
        this.amount = booking.getTotalAmount(); this.status = PaymentStatus.SUCCESS;
        this.paidAt = Instant.now(); this.createdAt = paidAt; this.updatedAt = paidAt;
    }
    public Long getId() { return id; }
    public String getTransactionCode() { return transactionCode; }
    public Instant getPaidAt() { return paidAt; }
    public BigDecimal getAmount() { return amount; }
    public PaymentMethod getMethod() { return method; }
    public PaymentStatus getStatus() { return status; }
    public void refund() { this.status = PaymentStatus.REFUNDED; this.updatedAt = Instant.now(); }
}
