package com.sporthub.backend.controller;

import com.sporthub.backend.dto.BorrowEquipmentRequest;
import com.sporthub.backend.dto.EquipmentLoanResponse;
import com.sporthub.backend.dto.EquipmentResponse;
import com.sporthub.backend.dto.ReturnEquipmentRequest;
import com.sporthub.backend.entity.Equipment;
import com.sporthub.backend.entity.EquipmentLoan;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.EquipmentLoanRepository;
import com.sporthub.backend.repository.EquipmentRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/receptionist")
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentLoanRepository loanRepository;
    private final UserRepository userRepository;

    public EquipmentController(
            EquipmentRepository equipmentRepository,
            EquipmentLoanRepository loanRepository,
            UserRepository userRepository) {
        this.equipmentRepository = equipmentRepository;
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/equipments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EquipmentResponse>> getEquipments() {
        return ResponseEntity.ok(equipmentRepository.findAll().stream().map(this::toEquipmentResponse).toList());
    }

    @PostMapping("/equipments")
    @Transactional
    public ResponseEntity<EquipmentResponse> createEquipment(@RequestBody Equipment req) {
        if (req.getItemName() == null || req.getItemName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên dụng cụ không được để trống.");
        }
        Equipment eq = Equipment.builder()
                .itemName(req.getItemName().trim())
                .category(req.getCategory() == null ? "Phụ kiện" : req.getCategory().trim())
                .rentalPricePerHour(req.getRentalPricePerHour() == null ? BigDecimal.ZERO : req.getRentalPricePerHour())
                .totalQuantity(req.getTotalQuantity() == null ? 1 : req.getTotalQuantity())
                .availableQuantity(req.getAvailableQuantity() == null ? (req.getTotalQuantity() == null ? 1 : req.getTotalQuantity()) : req.getAvailableQuantity())
                .status("ACTIVE")
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(toEquipmentResponse(equipmentRepository.save(eq)));
    }

    @PutMapping("/equipments/{id}")
    @Transactional
    public ResponseEntity<EquipmentResponse> updateEquipment(@PathVariable Long id, @RequestBody Equipment req) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dụng cụ."));
        if (req.getTotalQuantity() != null && req.getTotalQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tổng số lượng không thể âm.");
        }
        if (req.getAvailableQuantity() != null && req.getAvailableQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng khả dụng không thể âm.");
        }
        if (req.getItemName() != null) eq.setItemName(req.getItemName());
        if (req.getCategory() != null) eq.setCategory(req.getCategory());
        if (req.getRentalPricePerHour() != null) eq.setRentalPricePerHour(req.getRentalPricePerHour());
        if (req.getTotalQuantity() != null) eq.setTotalQuantity(req.getTotalQuantity());
        if (req.getAvailableQuantity() != null) eq.setAvailableQuantity(req.getAvailableQuantity());
        if (req.getStatus() != null) eq.setStatus(req.getStatus());
        return ResponseEntity.ok(toEquipmentResponse(equipmentRepository.save(eq)));
    }

    @GetMapping("/equipment-loans")
    @Transactional
    public ResponseEntity<List<EquipmentLoanResponse>> getLoans() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<EquipmentLoan> loans = loanRepository.findAllByOrderByLoanedAtDesc();
        boolean hasChanged = false;
        for (EquipmentLoan loan : loans) {
            if ("BORROWED".equalsIgnoreCase(loan.getStatus())
                    && loan.getLoanedAt() != null
                    && loan.getLoanedAt().isBefore(sevenDaysAgo)) {
                loan.setStatus("OVERDUE");
                hasChanged = true;
            }
        }
        if (hasChanged) {
            loanRepository.saveAll(loans);
        }
        return ResponseEntity.ok(loans.stream().map(this::toLoanResponse).toList());
    }

    @PostMapping("/equipment-loans")
    @Transactional
    public ResponseEntity<EquipmentLoanResponse> borrowEquipment(
            @RequestBody BorrowEquipmentRequest req,
            Authentication auth) {
        if (req.memberId() == null || req.itemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hội viên và dụng cụ.");
        }

        User member = userRepository.findById(req.memberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));

        Equipment item = equipmentRepository.findById(req.itemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dụng cụ."));

        if (req.quantity() != null && req.quantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng mượn phải lớn hơn 0.");
        }
        int qty = req.quantity() == null ? 1 : req.quantity();
        if (item.getAvailableQuantity() < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dụng cụ không đủ số lượng còn trống (chỉ còn " + item.getAvailableQuantity() + ").");
        }

        Long recorderId = null;
        if (auth != null && auth.getName() != null) {
            try {
                recorderId = Long.valueOf(auth.getName());
            } catch (Exception ignored) {
            }
        }

        // Deduct inventory
        item.setAvailableQuantity(item.getAvailableQuantity() - qty);
        equipmentRepository.save(item);

        EquipmentLoan loan = EquipmentLoan.builder()
                .memberId(member.getUserId())
                .memberName(member.getFullName())
                .phone(member.getPhone() != null ? member.getPhone() : member.getEmail())
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .quantity(qty)
                .rentalPricePerHour(item.getRentalPricePerHour())
                .loanedAt(LocalDateTime.now())
                .status("BORROWED")
                .recordedBy(recorderId)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toLoanResponse(loanRepository.save(loan)));
    }

    @PostMapping("/equipment-loans/{id}/return")
    @Transactional
    public ResponseEntity<EquipmentLoanResponse> returnEquipment(
            @PathVariable Long id,
            @RequestBody(required = false) ReturnEquipmentRequest req) {
        EquipmentLoan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin mượn đồ."));

        if (!"BORROWED".equalsIgnoreCase(loan.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dụng cụ này đã được trả trước đó.");
        }

        LocalDateTime now = LocalDateTime.now();
        loan.setReturnedAt(now);
        loan.setStatus("RETURNED");

        // Calculate hours and fee
        long hours = 1;
        if (loan.getLoanedAt() != null) {
            long minutes = Math.max(1, Duration.between(loan.getLoanedAt(), now).toMinutes());
            hours = (long) Math.ceil(minutes / 60.0);
        }

        BigDecimal rate = loan.getRentalPricePerHour() == null ? BigDecimal.ZERO : loan.getRentalPricePerHour();
        BigDecimal fee = rate.multiply(BigDecimal.valueOf(hours * loan.getQuantity()));
        loan.setRentalFee(fee);
        if (req != null && req.paymentMethod() != null) {
            loan.setPaymentMethod(req.paymentMethod());
        } else {
            loan.setPaymentMethod(fee.signum() > 0 ? "CASH" : null);
        }

        // Return stock to equipment
        equipmentRepository.findById(loan.getItemId()).ifPresent(item -> {
            int newAvailable = item.getAvailableQuantity() + loan.getQuantity();
            if (item.getTotalQuantity() != null && newAvailable > item.getTotalQuantity()) {
                newAvailable = item.getTotalQuantity();
            }
            item.setAvailableQuantity(newAvailable);
            equipmentRepository.save(item);
        });

        return ResponseEntity.ok(toLoanResponse(loanRepository.save(loan)));
    }

    private EquipmentResponse toEquipmentResponse(Equipment e) {
        return new EquipmentResponse(
                e.getItemId(),
                e.getItemName(),
                e.getCategory(),
                e.getRentalPricePerHour(),
                e.getTotalQuantity(),
                e.getAvailableQuantity(),
                e.getStatus());
    }

    private EquipmentLoanResponse toLoanResponse(EquipmentLoan l) {
        return new EquipmentLoanResponse(
                l.getLoanId(),
                l.getMemberId(),
                l.getMemberName(),
                l.getPhone(),
                l.getItemId(),
                l.getItemName(),
                l.getQuantity(),
                l.getRentalPricePerHour(),
                l.getLoanedAt(),
                l.getReturnedAt(),
                l.getRentalFee(),
                l.getStatus(),
                l.getPaymentMethod(),
                l.getRecordedBy());
    }
}
