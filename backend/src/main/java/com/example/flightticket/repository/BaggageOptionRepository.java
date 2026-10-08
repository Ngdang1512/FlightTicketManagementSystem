package com.example.flightticket.repository;

import com.example.flightticket.entity.BaggageOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaggageOptionRepository extends JpaRepository<BaggageOption, Long> {
    List<BaggageOption> findAllByOrderByAirlineNameAscWeightKgAsc();
    List<BaggageOption> findByAirlineIdAndActiveTrueOrderByWeightKgAsc(Long airlineId);
    boolean existsByAirlineId(Long airlineId);
}
