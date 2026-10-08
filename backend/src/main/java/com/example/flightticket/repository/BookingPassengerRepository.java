package com.example.flightticket.repository;

import com.example.flightticket.entity.BookingPassenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BookingPassengerRepository extends JpaRepository<BookingPassenger, Long> {
    @Query("""
            SELECT CASE WHEN COUNT(passenger) > 0 THEN true ELSE false END
            FROM BookingPassenger passenger
            WHERE passenger.booking.flight.id = :flightId
              AND UPPER(passenger.seatNumber) = UPPER(:seatNumber)
              AND passenger.booking.status IN (com.example.flightticket.entity.BookingStatus.PENDING,
                                               com.example.flightticket.entity.BookingStatus.PAID,
                                               com.example.flightticket.entity.BookingStatus.REFUND_REQUESTED)
            """)
    boolean existsActiveSeat(@Param("flightId") Long flightId, @Param("seatNumber") String seatNumber);

    @Query("""
            SELECT passenger.seatNumber FROM BookingPassenger passenger
            WHERE passenger.booking.flight.id = :flightId
              AND passenger.seatNumber IS NOT NULL
              AND passenger.booking.status IN (com.example.flightticket.entity.BookingStatus.PENDING,
                                               com.example.flightticket.entity.BookingStatus.PAID,
                                               com.example.flightticket.entity.BookingStatus.REFUND_REQUESTED)
            """)
    List<String> findActiveSeats(@Param("flightId") Long flightId);
}
