package com.sporthub.backend.controller;

import com.sporthub.backend.dto.MemberHealthProfileRequest;
import com.sporthub.backend.dto.MemberMembershipResponse;
import com.sporthub.backend.dto.MemberPackagePurchaseRequest;
import com.sporthub.backend.dto.MemberPackagePurchaseResponse;
import com.sporthub.backend.dto.MemberProfileRequest;
import com.sporthub.backend.dto.MemberProfileResponse;
import com.sporthub.backend.entity.MemberHealthProfile;
import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MemberHealthProfileRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/members/me")
@CrossOrigin(origins = "*")
public class MemberProfileController {

    private final UserRepository userRepository;
    private final MemberHealthProfileRepository healthRepository;
    private final UserMembershipRepository membershipRepository;
    private final MembershipPackageRepository packageRepository;
    private final ReceptionPaymentRepository paymentRepository;

    public MemberProfileController(
            UserRepository userRepository,
            MemberHealthProfileRepository healthRepository,
            UserMembershipRepository membershipRepository,
            MembershipPackageRepository packageRepository,
            ReceptionPaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.healthRepository = healthRepository;
        this.membershipRepository = membershipRepository;
        this.packageRepository = packageRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public MemberProfileResponse getProfile(Authentication authentication) {
        return toProfileResponse(findMember(memberId(authentication)));
    }

    @PutMapping
    @Transactional
    public MemberProfileResponse updateProfile(
            @RequestBody MemberProfileRequest request,
            Authentication authentication) {
        if (request.fullName() == null || request.fullName().isBlank()
                || request.fullName().trim().length() > 100
                || (request.phone() != null && request.phone().length() > 15)
                || (request.gender() != null && request.gender().length() > 20)
                || (request.address() != null && request.address().length() > 500)
                || (request.emergencyContactName() != null && request.emergencyContactName().length() > 100)
                || (request.emergencyContactPhone() != null && request.emergencyContactPhone().length() > 15)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên hoặc số điện thoại không hợp lệ.");
        }
        User user = findMember(memberId(authentication));
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        user.setAddress(request.address());
        user.setEmergencyContactName(request.emergencyContactName());
        user.setEmergencyContactPhone(request.emergencyContactPhone());
        return toProfileResponse(userRepository.save(user));
    }

    @GetMapping("/health")
    @Transactional(readOnly = true)
    public MemberHealthProfile getHealthProfile(Authentication authentication) {
        Long memberId = memberId(authentication);
        return healthRepository.findByMemberId(memberId).orElseGet(() -> {
            MemberHealthProfile empty = new MemberHealthProfile();
            empty.setMemberId(memberId);
            return empty;
        });
    }

    @PutMapping("/health")
    @Transactional
    public MemberHealthProfile updateHealthProfile(
            @RequestBody MemberHealthProfileRequest request,
            Authentication authentication) {
        if (!isNonNegative(request.weightKg())
                || !isNonNegative(request.heightCm())
                || !isNonNegative(request.smmKg())
                || !isNonNegative(request.pbfPercent())
                || !isNonNegative(request.bmi())
                || (request.pbfPercent() != null && request.pbfPercent().compareTo(java.math.BigDecimal.valueOf(100)) > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Các chỉ số sức khỏe không hợp lệ.");
        }
        Long memberId = memberId(authentication);
        MemberHealthProfile profile = healthRepository.findByMemberId(memberId)
                .orElseGet(() -> {
                    MemberHealthProfile created = new MemberHealthProfile();
                    created.setMemberId(memberId);
                    return created;
                });
        profile.setFitnessLevel(request.fitnessLevel());
        profile.setFitnessGoals(request.fitnessGoals());
        profile.setInjuryHistory(request.injuryHistory());
        profile.setWeightKg(request.weightKg());
        profile.setHeightCm(request.heightCm());
        profile.setSmmKg(request.smmKg());
        profile.setPbfPercent(request.pbfPercent());
        profile.setBmi(request.bmi());
        profile.setUpdatedAt(LocalDateTime.now());
        return healthRepository.save(profile);
    }

    @GetMapping("/memberships")
    @Transactional(readOnly = true)
    public List<MemberMembershipResponse> getMemberships(Authentication authentication) {
        return membershipRepository.findByUserIdOrderByEndDateDesc(memberId(authentication))
                .stream()
                .map(membership -> {
                    MembershipPackage membershipPackage = packageRepository.findById(membership.getPackageId())
                            .orElse(null);
                    return new MemberMembershipResponse(
                            membership.getMembershipId(),
                            membershipPackage == null ? "Gói tập" : membershipPackage.getName(),
                            membership.getStartDate(),
                            membership.getEndDate(),
                            membership.getStatus());
                })
                .toList();
    }

    @PostMapping("/memberships")
    @Transactional
    public MemberPackagePurchaseResponse purchaseMembership(
            @RequestBody MemberPackagePurchaseRequest request,
            Authentication authentication) {
        if (request == null || request.packageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn gói tập.");
        }
        Long userId = memberId(authentication);
        MembershipPackage membershipPackage = packageRepository.findById(request.packageId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gói tập không còn được mở bán."));
        UserMembership membership = new UserMembership();
        membership.setUserId(userId);
        membership.setPackageId(membershipPackage.getPackageId());
        membership.setStatus("PENDING");
        UserMembership savedMembership = membershipRepository.save(membership);

        ReceptionPayment payment = new ReceptionPayment();
        payment.setMemberId(Math.toIntExact(userId));
        payment.setMembershipId(Math.toIntExact(savedMembership.getMembershipId()));
        payment.setAmount(membershipPackage.getPrice());
        payment.setPaymentMethod("ONLINE");
        payment.setPaymentStatus("PENDING");
        payment.setCreatedAt(LocalDateTime.now());
        ReceptionPayment savedPayment = paymentRepository.save(payment);
        return new MemberPackagePurchaseResponse(
                savedPayment.getPaymentId().longValue(),
                savedMembership.getMembershipId(),
                membershipPackage.getName(),
                savedPayment.getAmount(),
                savedPayment.getPaymentStatus(),
                savedPayment.getCreatedAt());
    }

    private Long memberId(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_MEMBER".equals(authority.getAuthority()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ hội viên mới được truy cập hồ sơ.");
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private User findMember(Long memberId) {
        return userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hội viên."));
    }

    private MemberProfileResponse toProfileResponse(User user) {
        return new MemberProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getDateOfBirth(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getGender(),
                user.getAddress(),
                user.getEmergencyContactName(),
                user.getEmergencyContactPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt());
    }

    private boolean isNonNegative(java.math.BigDecimal value) {
        return value == null || value.signum() >= 0;
    }
}
