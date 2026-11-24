package com.sporthub.backend.controller;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.repository.MembershipPackageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/packages")
@CrossOrigin(origins = "*")
public class PackageController {

    private final MembershipPackageRepository packageRepository;

    PackageController(MembershipPackageRepository packageRepository) {
        this.packageRepository = packageRepository;
    }

    // API 1: Lấy danh sách các gói tập đang ACTIVE (Cho Member / Receptionist)
    @GetMapping
    public ResponseEntity<List<MembershipPackage>> getAllPackages() {
        return ResponseEntity.ok(packageRepository.findByStatus("ACTIVE"));
    }

    // API 2: Tạo mới gói tập (Dành cho Manager)
    @PostMapping
    public ResponseEntity<MembershipPackage> createPackage(
            @RequestBody MembershipPackage newPackage,
            Authentication authentication) {
        boolean isManager = authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(Set.of("ROLE_MANAGER", "ROLE_ADMIN")::contains);
        if (!isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản lý mới được tạo gói tập.");
        }
        if (newPackage == null || newPackage.getName() == null || newPackage.getName().isBlank()
                || newPackage.getName().trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên gói tập là bắt buộc và tối đa 100 ký tự.");
        }
        if (newPackage.getMembershipTier() != null && newPackage.getMembershipTier().trim().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã hạng hội viên tối đa 100 ký tự.");
        }
        if (newPackage.getPrice() == null || newPackage.getPrice().signum() <= 0
                || newPackage.getPrice().scale() > 2 || newPackage.getPrice().precision() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá gói tập không hợp lệ.");
        }
        if (newPackage.getDurationDays() == null || newPackage.getDurationDays() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời hạn gói tập phải lớn hơn 0 ngày.");
        }
        if (newPackage.getQuotaSessions() != null && newPackage.getQuotaSessions() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số buổi tập không được âm.");
        }
        if (newPackage.getQuotaCourts() != null && newPackage.getQuotaCourts() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số giờ sân không được âm.");
        }
        String accessType = (newPackage.getAccessType() == null || newPackage.getAccessType().isBlank())
                ? "ALL_DAY" : newPackage.getAccessType().trim().toUpperCase(Locale.ROOT);
        if (!List.of("ALL_DAY", "PEAK", "OFF_PEAK").contains(accessType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ áp dụng không hợp lệ.");
        }
        String status = (newPackage.getStatus() == null || newPackage.getStatus().isBlank())
                ? "ACTIVE" : newPackage.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!List.of("ACTIVE", "INACTIVE").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái gói tập không hợp lệ.");
        }
        newPackage.setName(newPackage.getName().trim());
        newPackage.setMembershipTier(com.sporthub.backend.enums.MembershipTier.normalize(newPackage.getMembershipTier()));
        newPackage.setAccessType(accessType);
        newPackage.setStatus(status);
        boolean presetTier = com.sporthub.backend.enums.MembershipTier.fromString(newPackage.getMembershipTier()).isPresent();
        if (newPackage.getPackageType() == null || presetTier) {
            newPackage.setPackageType(com.sporthub.backend.enums.PackageType.VIP);
        }
        if (presetTier) {
            newPackage.setSportId(null);
        }
        if ("ACTIVE".equals(status)) {
            if (newPackage.getMembershipTier() != null
                    && packageRepository.existsByMembershipTierIgnoreCaseAndStatusAndPackageIdNot(newPackage.getMembershipTier(), "ACTIVE", -1L)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hạng này đã mở bán. Hãy cập nhật cấu hình hiện có.");
            }
            if (packageRepository.existsByNameIgnoreCaseAndStatusAndPackageIdNot(newPackage.getName(), "ACTIVE", -1L)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên hạng hội viên này đã mở bán. Vui lòng chọn tên khác hoặc cập nhật gói hiện có.");
            }
        }
        MembershipPackage saved = packageRepository.save(newPackage);
        return ResponseEntity.ok(saved);
    }
}
