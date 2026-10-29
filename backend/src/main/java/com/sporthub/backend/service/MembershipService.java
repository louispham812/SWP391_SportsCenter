package com.sporthub.backend.service;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service xử lý nghiệp vụ membership và quota tracking
 * Theo DATABASE_SCHEMA_SPECIFICATION.md Section 2.4 và 5.1
 */
@Service
public class MembershipService {

    private final UserMembershipRepository userMembershipRepository;
    private final MembershipPackageRepository membershipPackageRepository;

    public MembershipService(
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository) {
        this.userMembershipRepository = userMembershipRepository;
        this.membershipPackageRepository = membershipPackageRepository;
    }

    /**
     * MGR-08: Manager duyệt gói membership
     * Workflow: PENDING_APPROVAL → ACTIVE
     * Kích hoạt quota theo loại gói
     */
    @Transactional
    public void approveMembership(Long membershipId, Long managerId) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        if (!"PENDING".equals(membership.getStatus()) && !"PENDING_APPROVAL".equals(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chỉ có thể duyệt gói ở trạng thái PENDING hoặc PENDING_APPROVAL");
        }

        // Lấy thông tin package để set quota
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Package không tồn tại"));

        // Kích hoạt gói
        membership.setStatus("ACTIVE");
        
        // Set thời hạn
        LocalDate now = LocalDate.now();
        membership.setStartDate(now);
        membership.setEndDate(now.plusDays(pkg.getDurationDays()));

        // Set quota ban đầu theo package
        Integer quotaSessions = pkg.getQuotaSessions() != null ? pkg.getQuotaSessions() : 0;
        membership.setInitialQuotaSessions(quotaSessions);
        membership.setRemainingQuotaSessions(quotaSessions);
        membership.setHeldQuotaSessions(0);
        membership.setUsedQuotaSessions(0);

        userMembershipRepository.save(membership);

        // TODO: Gửi notification cho member: "Gói của bạn đã được kích hoạt"
        // TODO: Ghi audit log
    }

    /**
     * MGR-09: Manager từ chối gói và hoàn tiền 100%
     * Workflow: PENDING_APPROVAL → REJECTED
     */
    @Transactional
    public void rejectMembership(Long membershipId, String reason, Long managerId) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        if (!"PENDING".equals(membership.getStatus()) && !"PENDING_APPROVAL".equals(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chỉ có thể từ chối gói ở trạng thái PENDING hoặc PENDING_APPROVAL");
        }

        membership.setStatus("REJECTED");
        userMembershipRepository.save(membership);

        // TODO: Tạo refund_request với approved = true, refund 100%
        // TODO: Gửi notification cho member: "Gói của bạn đã bị từ chối. Lý do: {reason}"
        // TODO: Ghi audit log
    }

    /**
     * Tìm gói membership ACTIVE và còn quota để dùng cho booking
     * 
     * @param userId ID member
     * @param requiredQuota số quota cần (thường = 1 cho 1 booking)
     * @return UserMembership nếu đủ điều kiện, null nếu không
     */
    @Transactional(readOnly = true)
    public UserMembership getActiveMembershipWithQuota(Long userId, int requiredQuota) {
        List<UserMembership> memberships = userMembershipRepository.findByUserIdAndStatus(userId, "ACTIVE");

        return memberships.stream()
                .filter(m -> m.getEndDate() != null && m.getEndDate().isAfter(LocalDate.now())) // Chưa hết hạn
                .filter(m -> m.getRemainingQuotaSessions() != null && m.getRemainingQuotaSessions() >= requiredQuota) // Đủ quota
                .findFirst()
                .orElse(null);
    }

    /**
     * Validate quota formula luôn đúng
     * Formula: remaining + held + used = initial
     * 
     * @throws IllegalStateException nếu formula sai
     */
    public void validateQuotaFormula(UserMembership membership) {
        int remaining = membership.getRemainingQuotaSessions() != null ? membership.getRemainingQuotaSessions() : 0;
        int held = membership.getHeldQuotaSessions() != null ? membership.getHeldQuotaSessions() : 0;
        int used = membership.getUsedQuotaSessions() != null ? membership.getUsedQuotaSessions() : 0;
        int initial = membership.getInitialQuotaSessions() != null ? membership.getInitialQuotaSessions() : 0;

        int total = remaining + held + used;
        if (total != initial) {
            throw new IllegalStateException(String.format(
                    "Quota formula broken for membership %d! remaining(%d) + held(%d) + used(%d) = %d != initial(%d)",
                    membership.getMembershipId(), remaining, held, used, total, initial));
        }
    }

    /**
     * Trừ quota khi tạo booking
     * remaining → held (giữ chỗ)
     */
    @Transactional
    public void holdQuota(Long membershipId, int quotaAmount) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        if (membership.getRemainingQuotaSessions() < quotaAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("Không đủ quota. Còn lại: %d, cần: %d",
                            membership.getRemainingQuotaSessions(), quotaAmount));
        }

        membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() - quotaAmount);
        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() + quotaAmount);

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }

    /**
     * Hoàn quota khi hủy booking
     * held → remaining (hoàn lại)
     */
    @Transactional
    public void releaseQuota(Long membershipId, int quotaAmount) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() - quotaAmount);
        membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() + quotaAmount);

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }

    /**
     * Trừ quota thực sự khi check-in/điểm danh PRESENT
     * held → used (đã dùng)
     */
    @Transactional
    public void consumeQuota(Long membershipId, int quotaAmount) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() - quotaAmount);
        membership.setUsedQuotaSessions(membership.getUsedQuotaSessions() + quotaAmount);

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }

    /**
     * Hoàn quota khi vắng có phép (EXCUSED_ABSENCE)
     * held → remaining (nếu booking trong thời hạn gói)
     * held → used (nếu booking ngoài thời hạn gói)
     * 
     * Business Rule:
     * - Booking TRONG thời hạn gói (startTime <= endDate): Hoàn quota (held → remaining)
     * - Booking NGOÀI thời hạn gói (startTime > endDate): KHÔNG hoàn (held → used, quota mất)
     * 
     * @param membershipId ID membership
     * @param quotaAmount số quota (thường = 1)
     * @param bookingStartTime thời gian bắt đầu của booking
     */
    @Transactional
    public void refundQuotaForExcusedAbsence(Long membershipId, int quotaAmount, LocalDateTime bookingStartTime) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() - quotaAmount);

        // Kiểm tra booking có trong thời hạn gói không
        boolean isWithinPeriod = isBookingWithinMembershipPeriod(membership, bookingStartTime);
        
        if (isWithinPeriod) {
            // Booking trong thời hạn gói → Hoàn quota
            membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() + quotaAmount);
        } else {
            // Booking ngoài thời hạn gói → KHÔNG hoàn, chuyển held → used (quota mất)
            membership.setUsedQuotaSessions(membership.getUsedQuotaSessions() + quotaAmount);
        }

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }
    
    /**
     * Helper method: Kiểm tra booking có trong thời hạn membership không
     * 
     * @param membership UserMembership
     * @param bookingStartTime Thời gian bắt đầu của booking
     * @return true nếu booking trong thời hạn, false nếu ngoài thời hạn
     */
    private boolean isBookingWithinMembershipPeriod(UserMembership membership, LocalDateTime bookingStartTime) {
        if (membership.getEndDate() == null || bookingStartTime == null) {
            return false;
        }
        return !bookingStartTime.toLocalDate().isAfter(membership.getEndDate());
    }

    /**
     * Hoàn quota từ used về remaining khi sửa điểm danh
     * PRESENT/UNEXCUSED → EXCUSED_ABSENCE
     * 
     * Business Rule:
     * - Booking TRONG thời hạn gói (startTime <= endDate): Hoàn quota (used → remaining)
     * - Booking NGOÀI thời hạn gói (startTime > endDate): Giữ nguyên used (không hoàn, không thay đổi)
     * 
     * @param membershipId ID membership
     * @param quotaAmount số quota (thường = 1)
     * @param bookingStartTime thời gian bắt đầu của booking
     */
    @Transactional
    public void refundUsedQuotaForExcusedAbsence(Long membershipId, int quotaAmount, LocalDateTime bookingStartTime) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        // Kiểm tra booking có trong thời hạn gói không
        boolean isWithinPeriod = isBookingWithinMembershipPeriod(membership, bookingStartTime);
        
        if (isWithinPeriod) {
            // Booking trong thời hạn → Hoàn quota
            membership.setUsedQuotaSessions(membership.getUsedQuotaSessions() - quotaAmount);
            membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() + quotaAmount);
        }
        // Nếu booking ngoài thời hạn: Không làm gì (used và remaining giữ nguyên, quota mất)

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }

    /**
     * Trừ quota từ remaining sang used khi sửa điểm danh
     * EXCUSED_ABSENCE → PRESENT/UNEXCUSED_ABSENCE
     * 
     * Logic:
     * - Kiểm tra remaining >= quotaAmount
     * - remaining GIẢM
     * - used TĂNG
     * - held KHÔNG ĐỔI
     */
    @Transactional
    public void consumeQuotaFromRemaining(Long membershipId, int quotaAmount) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Membership không tồn tại"));

        if (membership.getRemainingQuotaSessions() < quotaAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("⚠️ Không thể sửa điểm danh. Quota còn lại không đủ. Cần: %d, còn: %d",
                            quotaAmount, membership.getRemainingQuotaSessions()));
        }

        membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() - quotaAmount);
        membership.setUsedQuotaSessions(membership.getUsedQuotaSessions() + quotaAmount);

        userMembershipRepository.save(membership);
        validateQuotaFormula(membership);
    }
}
