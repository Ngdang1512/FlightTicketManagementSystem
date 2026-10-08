package com.example.flightticket.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
@Entity
@Table(name = "fare_classes")
public class FareClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 300)
    private String description;

    protected FareClass() {
    }

    public FareClass(String code, String name, String description) { update(code, name, description); }

    public void update(String code, String name, String description) {
        this.code = code.trim().toUpperCase(); this.name = name.trim();
        this.description = description == null || description.isBlank() ? null : description.trim();
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
}
