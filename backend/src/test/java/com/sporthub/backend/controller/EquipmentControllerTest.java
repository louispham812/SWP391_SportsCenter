package com.sporthub.backend.controller;

import com.sporthub.backend.dto.BorrowEquipmentRequest;
import com.sporthub.backend.dto.ReturnEquipmentRequest;
import com.sporthub.backend.entity.Equipment;
import com.sporthub.backend.entity.EquipmentLoan;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.EquipmentLoanRepository;
import com.sporthub.backend.repository.EquipmentRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EquipmentControllerTest {

    private final EquipmentRepository equipmentRepository = mock(EquipmentRepository.class);
    private final EquipmentLoanRepository loanRepository = mock(EquipmentLoanRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final EquipmentController controller =
            new EquipmentController(equipmentRepository, loanRepository, userRepository);

    private final UsernamePasswordAuthenticationToken receptionistAuth =
            new UsernamePasswordAuthenticationToken(
                    "4", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));

    @Test
    void borrowEquipmentTruncatesLongEmailFallbackPhoneToColumnLimit() {
        User member = User.builder()
                .userId(9L)
                .fullName("Nguyễn Anh Khoa")
                .email("very.long.member.email@sporthub.example.com")
                .phone(null)
                .role("MEMBER")
                .status("ACTIVE")
                .build();
        Equipment item = Equipment.builder()
                .itemId(1L)
                .itemName("Vợt Tennis")
                .category("Vợt")
                .rentalPricePerHour(new BigDecimal("30000"))
                .totalQuantity(10)
                .availableQuantity(5)
                .status("ACTIVE")
                .build();

        when(userRepository.findById(9L)).thenReturn(Optional.of(member));
        when(equipmentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(loanRepository.save(any())).thenAnswer(inv -> {
            EquipmentLoan l = inv.getArgument(0);
            l.setLoanId(100L);
            return l;
        });

        var res = controller.borrowEquipment(new BorrowEquipmentRequest(9L, 1L, 2), receptionistAuth).getBody();

        assertNotNull(res);
        assertEquals(3, item.getAvailableQuantity());
        assertNotNull(res.phone());
        assertTrue(res.phone().length() <= 20);
        assertEquals(4L, res.recordedBy());
    }

    @Test
    void returnEquipmentCalculatesFeeSetsReturnedAtNormalizesMethodAndUpdatesCollector() {
        EquipmentLoan loan = EquipmentLoan.builder()
                .loanId(201L)
                .memberId(9L)
                .memberName("Nguyễn Anh Khoa")
                .itemId(1L)
                .itemName("Vợt Tennis")
                .quantity(2)
                .rentalPricePerHour(new BigDecimal("30000"))
                .loanedAt(LocalDateTime.now().minusMinutes(75))
                .status("borrowed")
                .recordedBy(3L)
                .build();
        Equipment item = Equipment.builder()
                .itemId(1L)
                .totalQuantity(10)
                .availableQuantity(8)
                .build();

        when(loanRepository.findByIdForUpdate(201L)).thenReturn(Optional.of(loan));
        when(equipmentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(item));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(loanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var res = controller.returnEquipment(201L, new ReturnEquipmentRequest(" vnpay "), receptionistAuth).getBody();

        assertNotNull(res);
        assertEquals("RETURNED", res.status());
        assertNotNull(res.returnedAt());
        assertEquals(0, new BigDecimal("120000").compareTo(res.rentalFee()));
        assertEquals("VNPAY", res.paymentMethod());
        assertEquals(4L, res.recordedBy());
        assertEquals(10, item.getAvailableQuantity());
    }

    @Test
    void returnEquipmentHandlesNullStatusAndRejectsUnsupportedPaymentMethod() {
        EquipmentLoan nullStatusLoan = EquipmentLoan.builder()
                .loanId(202L)
                .status(null)
                .build();
        when(loanRepository.findByIdForUpdate(202L)).thenReturn(Optional.of(nullStatusLoan));

        ResponseStatusException conflict = assertThrows(
                ResponseStatusException.class,
                () -> controller.returnEquipment(202L, new ReturnEquipmentRequest("CASH"), receptionistAuth));
        assertEquals(409, conflict.getStatusCode().value());

        EquipmentLoan validLoan = EquipmentLoan.builder()
                .loanId(203L)
                .itemId(1L)
                .quantity(1)
                .rentalPricePerHour(new BigDecimal("20000"))
                .loanedAt(LocalDateTime.now().minusMinutes(10))
                .status("BORROWED")
                .build();
        when(loanRepository.findByIdForUpdate(203L)).thenReturn(Optional.of(validLoan));

        ResponseStatusException badMethod = assertThrows(
                ResponseStatusException.class,
                () -> controller.returnEquipment(203L, new ReturnEquipmentRequest("CRYPTO"), receptionistAuth));
        assertEquals(400, badMethod.getStatusCode().value());
    }

    @Test
    void returnFreeEquipmentClearsPaymentMethod() {
        EquipmentLoan freeLoan = EquipmentLoan.builder()
                .loanId(204L)
                .itemId(4L)
                .quantity(1)
                .rentalPricePerHour(BigDecimal.ZERO)
                .loanedAt(LocalDateTime.now().minusMinutes(30))
                .status("BORROWED")
                .build();
        Equipment item = Equipment.builder().itemId(4L).totalQuantity(50).availableQuantity(49).build();

        when(loanRepository.findByIdForUpdate(204L)).thenReturn(Optional.of(freeLoan));
        when(equipmentRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(item));
        when(equipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(loanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var res = controller.returnEquipment(204L, new ReturnEquipmentRequest("CASH"), receptionistAuth).getBody();

        assertNotNull(res);
        assertEquals(0, BigDecimal.ZERO.compareTo(res.rentalFee()));
        assertNull(res.paymentMethod());
    }
}
