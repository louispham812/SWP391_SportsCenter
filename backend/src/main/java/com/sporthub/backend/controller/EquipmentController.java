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
import java.util.Locale;
import java.util.Set;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/receptionist")
public class EquipmentController {

    private static final Set<String> RETURNABLE_LOAN_STATUSES = Set.of("BORROWED", "OVERDUE");
    private static final Set<String> ALLOWED_RETURN_PAYMENT_METHODS = Set.of(
            "CASH", "CASH_COUNTER", "VNPAY", "ONLINE", "POS", "VIETQR", "TRANSFER"
    );

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
        if (req == null || req.getItemName() == null || req.getItemName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên dụng cụ không được để trống.");
        }
        BigDecimal price = req.getRentalPricePerHour() == null ? BigDecimal.ZERO : req.getRentalPricePerHour();
        int totalQty = req.getTotalQuantity() == null ? 1 : req.getTotalQuantity();
        int availableQty = req.getAvailableQuantity() == null ? totalQty : req.getAvailableQuantity();
        if (price.signum() < 0 || totalQty < 0 || availableQty < 0 || availableQty > totalQty) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá thuê hoặc số lượng dụng cụ không hợp lệ.");
        }
        Equipment eq = Equipment.builder()
                .itemName(req.getItemName().trim())
                .category(req.getCategory() == null ? "Phụ kiện" : req.getCategory().trim())
                .rentalPricePerHour(price)
                .totalQuantity(totalQty)
                .availableQuantity(availableQty)
                .status("ACTIVE")
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(toEquipmentResponse(equipmentRepository.save(eq)));
    }

    @PutMapping("/equipments/{id}")
    @Transactional
    public ResponseEntity<EquipmentResponse> updateEquipment(@PathVariable Long id, @RequestBody Equipment req) {
        Equipment eq = equipmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dụng cụ."));
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu cập nhật không hợp lệ.");
        }
        if (req.getRentalPricePerHour() != null && req.getRentalPricePerHour().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá thuê theo giờ không thể âm.");
        }
        if (req.getTotalQuantity() != null && req.getTotalQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tổng số lượng không thể âm.");
        }
        if (req.getAvailableQuantity() != null && req.getAvailableQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng khả dụng không thể âm.");
        }
        int nextTotal = req.getTotalQuantity() != null ? req.getTotalQuantity() : eq.getTotalQuantity();
        int nextAvailable = req.getAvailableQuantity() != null ? req.getAvailableQuantity() : eq.getAvailableQuantity();
        if (nextAvailable > nextTotal) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng khả dụng không thể vượt quá tổng số lượng.");
        }
        if (req.getItemName() != null) eq.setItemName(req.getItemName().trim());
        if (req.getCategory() != null) eq.setCategory(req.getCategory().trim());
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
        if (req == null || req.memberId() == null || req.itemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn hội viên và dụng cụ.");
        }

        User member = userRepository.findById(req.memberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));

        Equipment item = equipmentRepository.findByIdForUpdate(req.itemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dụng cụ."));

        if (req.quantity() != null && req.quantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng mượn phải lớn hơn 0.");
        }
        int qty = req.quantity() == null ? 1 : req.quantity();
        int available = item.getAvailableQuantity() == null ? 0 : item.getAvailableQuantity();
        if (available < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dụng cụ không đủ số lượng còn trống (chỉ còn " + available + ").");
        }

        Long recorderId = resolveRecorderId(auth);

        if (!"ACTIVE".equalsIgnoreCase(item.getStatus()) || !"ACTIVE".equalsIgnoreCase(member.getStatus()) || !"MEMBER".equalsIgnoreCase(member.getRole()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hội viên hoặc dụng cụ không hoạt động.");
        // Deduct inventory
        item.setAvailableQuantity(available - qty);
        equipmentRepository.save(item);

        String contact = (member.getPhone() != null && !member.getPhone().isBlank())
                ? member.getPhone().trim()
                : member.getEmail();
        EquipmentLoan loan = EquipmentLoan.builder()
                .memberId(member.getUserId())
                .memberName(member.getFullName())
                .phone(truncate(contact, 20))
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .quantity(qty)
                .rentalPricePerHour(item.getRentalPricePerHour() == null ? BigDecimal.ZERO : item.getRentalPricePerHour())
                .loanedAt(LocalDateTime.now())
                .status("BORROWED")
                .recordedBy(recorderId)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toLoanResponse(loanRepository.save(loan)));
    }

    public ResponseEntity<EquipmentLoanResponse> returnEquipment(Long id, ReturnEquipmentRequest req) {
        return returnEquipment(id, req, null);
    }

    @PostMapping("/equipment-loans/{id}/return")
    @Transactional
    public ResponseEntity<EquipmentLoanResponse> returnEquipment(
            @PathVariable Long id,
            @RequestBody(required = false) ReturnEquipmentRequest req,
            Authentication auth) {
        EquipmentLoan loan = loanRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin mượn đồ."));

        String currentStatus = loan.getStatus() == null ? "" : loan.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!RETURNABLE_LOAN_STATUSES.contains(currentStatus)) {
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

        int qty = (loan.getQuantity() == null || loan.getQuantity() <= 0) ? 1 : loan.getQuantity();
        BigDecimal rate = loan.getRentalPricePerHour() == null ? BigDecimal.ZERO : loan.getRentalPricePerHour();
        BigDecimal fee = rate.multiply(BigDecimal.valueOf(hours)).multiply(BigDecimal.valueOf(qty));
        loan.setRentalFee(fee);
        if (fee.signum() > 0) {
            String rawMethod = (req != null && req.paymentMethod() != null && !req.paymentMethod().isBlank())
                    ? req.paymentMethod().trim().toUpperCase(Locale.ROOT)
                    : "CASH";
            if (!ALLOWED_RETURN_PAYMENT_METHODS.contains(rawMethod)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán không hợp lệ.");
            }
            String method = switch (rawMethod) {
                case "CASH_COUNTER" -> "CASH";
                case "ONLINE" -> "VNPAY";
                default -> rawMethod;
            };
            loan.setPaymentMethod(method);
        } else {
            loan.setPaymentMethod(null);
        }
        Long collectorId = resolveRecorderId(auth);
        if (collectorId != null) {
            loan.setRecordedBy(collectorId);
        }

        // Return stock to equipment
        equipmentRepository.findByIdForUpdate(loan.getItemId()).ifPresent(item -> {
            int currentAvailable = item.getAvailableQuantity() == null ? 0 : item.getAvailableQuantity();
            int newAvailable = currentAvailable + qty;
            if (item.getTotalQuantity() != null && newAvailable > item.getTotalQuantity()) {
                newAvailable = item.getTotalQuantity();
            }
            item.setAvailableQuantity(newAvailable);
            equipmentRepository.save(item);
        });

        return ResponseEntity.ok(toLoanResponse(loanRepository.save(loan)));
    }

    private Long resolveRecorderId(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return null;
        }
        String name = auth.getName().trim();
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException ignored) {
            return userRepository.findByEmailIgnoreCase(name).map(User::getUserId).orElse(null);
        }
    }

    private static String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
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
