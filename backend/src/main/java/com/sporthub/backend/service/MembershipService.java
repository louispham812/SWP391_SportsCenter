package com.sporthub.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.UserMembershipRepository;

/**
 * Service xử lý nghiệp vụ membership và quota tracking
 * Theo DATABASE_SCHEMA_SPECIFICATION.md Section 2.4 và 5.1
 */
@Service
public class MembershipService {

    private final UserMembershipRepository userMembershipRepository;
    private final MembershipPackageRepository membershipPackageRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.sporthub.backend.repository.PaymentTransactionRepository payments;
    @org.springframework.beans.factory.annotation.Autowired
    private com.sporthub.backend.repository.UserRepository users;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;
    private final RefundService refundService;
    private final EngagementService engagementService;
    private final AuditLogService auditLogService;

    public MembershipService(
            UserMembershipRepository userMembershipRepository,
            MembershipPackageRepository membershipPackageRepository,
            RefundService refundService,
            EngagementService engagementService,
            AuditLogService auditLogService) {
        this.userMembershipRepository = userMembershipRepository;
        this.membershipPackageRepository = membershipPackageRepository;
        this.refundService = refundService;
        this.engagementService = engagementService;
        this.auditLogService = auditLogService;
    }

    /**
     * MGR-08: Manager duyệt gói membership
     * Workflow: PENDING_APPROVAL → ACTIVE
     * Kích hoạt quota theo loại gói
     */
    @Transactional
    public void approveMembership(Long membershipId, Long managerId) {
        if (users != null) {
            UserMembership candidate = userMembershipRepository.findById(membershipId).orElseThrow();
            users.findByIdForUpdate(candidate.getUserId()).orElseThrow();
        }
        UserMembership membership = lockMembership(membershipId);

        if (!"PENDING".equals(membership.getStatus()) && !"PENDING_APPROVAL".equals(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chỉ có thể duyệt gói ở trạng thái PENDING hoặc PENDING_APPROVAL");
        }

        requirePaid(membership);
        // Lấy thông tin package để set quota
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Package không tồn tại"));

        // Kích hoạt gói
        membership.setStatus("ACTIVE");

        // Set thời hạn
        LocalDate now = LocalDate.now();
        LocalDate start = now;
        for (UserMembership old : userMembershipRepository.findByUserIdAndStatus(membership.getUserId(), "ACTIVE")) {
            if (old.getMembershipId().equals(membershipId) || old.getEndDate() == null || old.getEndDate().isBefore(now)) continue;
            MembershipPackage oldPackage = membershipPackageRepository.findById(old.getPackageId()).orElse(null);
            if (sameRenewalGroup(pkg, oldPackage) && !old.getEndDate().isBefore(start)) start = old.getEndDate().plusDays(1);
        }
        membership.setStartDate(start);
        membership.setEndDate(start.plusDays(Math.max(1, pkg.getDurationDays()) - 1));

        // Set quota ban đầu theo package
        Integer quotaSessions = pkg.getQuotaSessions() != null ? pkg.getQuotaSessions() : 0;
        membership.setInitialQuotaSessions(quotaSessions);
        membership.setRemainingQuotaSessions(quotaSessions);
        membership.setHeldQuotaSessions(0);
        membership.setUsedQuotaSessions(0);

        int quotaCourts = pkg.getQuotaCourts() != null ? pkg.getQuotaCourts() : 0;
        membership.setInitialQuotaCourts(quotaCourts);
        membership.setRemainingQuotaCourts(quotaCourts);
        membership.setHeldQuotaCourts(0);
        membership.setUsedQuotaCourts(0);

        userMembershipRepository.save(membership);

        // Send notification
        if (engagementService != null) {
            engagementService.notifyUser(
                membership.getUserId(),
                "Gói tập đã được kích hoạt",
                String.format("Gói tập '%s' của bạn đã được kích hoạt thành công! " +
                        "Hạn sử dụng: %s. Quota: %d buổi tập.",
                        pkg.getName(), 
                        membership.getEndDate(),
                        quotaSessions),
                "MEMBERSHIP"
            );
        }

        // Audit log
        if (auditLogService != null) {
            auditLogService.logSuccess(
                "MEMBERSHIP_APPROVED",
                String.format("Manager #%d", managerId),
                managerId,
                String.format("Approved membership #%d (Package: %s) for user #%d. Quota granted: %d sessions",
                        membership.getMembershipId(),
                        pkg.getName(),
                        membership.getUserId(),
                        quotaSessions)
            );
        }
    }

    /**
     * MGR-09: Manager từ chối gói và hoàn tiền 100%
     * Workflow: PENDING_APPROVAL → REJECTED
     */
    @Transactional
    public void rejectMembership(Long membershipId, String reason, Long managerId) {
        UserMembership membership = lockMembership(membershipId);

        if (!"PENDING".equals(membership.getStatus()) && !"PENDING_APPROVAL".equals(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Chỉ có thể từ chối gói ở trạng thái PENDING hoặc PENDING_APPROVAL");
        }

        // Get package info for notification
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Package không tồn tại"));

        requirePaid(membership);
        membership.setStatus("REJECTED");
        userMembershipRepository.save(membership);

        // Auto-create 100% refund request (approved immediately)
        if (refundService != null) {
            refundService.createRefundForRejectedMembership(membership, reason, managerId);
        }

        // Send notification
        if (engagementService != null) {
            engagementService.notifyUser(
                membership.getUserId(),
                "Gói tập đã bị từ chối",
                String.format("Gói tập '%s' của bạn đã bị từ chối bởi Quản lý. Lý do: %s. " +
                        "Yêu cầu hoàn tiền 100%% đã được tạo tự động và đang được xử lý.",
                        pkg.getName(),
                        reason),
                "MEMBERSHIP"
            );
        }

        // Audit log
        if (auditLogService != null) {
            auditLogService.logSuccess(
                "MEMBERSHIP_REJECTED",
                String.format("Manager #%d", managerId),
                managerId,
                String.format("Rejected membership #%d (Package: %s) for user #%d. Reason: %s. 100%% refund auto-created.",
                        membership.getMembershipId(),
                        pkg.getName(),
                        membership.getUserId(),
                        reason)
            );
        }
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
        return getActiveMembershipWithQuota(userId, requiredQuota, "CLASS", null);
    }

    @Transactional(readOnly = true)
    public UserMembership getActiveMembershipWithQuota(Long userId, int requiredQuota, String type, Long sportId) {
        return getActiveMembershipWithQuota(userId, requiredQuota, type, sportId, null, null);
    }

    @Transactional(readOnly = true)
    public UserMembership getActiveMembershipWithQuota(Long userId, int requiredQuota, String type, Long sportId,
            java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return userMembershipRepository.findByUserIdAndStatus(userId, "ACTIVE").stream()
            .filter(this::isEffective)
            .filter(m -> permitsBooking(m, start, end))
            .filter(m -> m.getRemainingQuotaSessions() != null && m.getRemainingQuotaSessions() >= requiredQuota)
            .filter(m -> {
                MembershipPackage p = membershipPackageRepository.findById(m.getPackageId()).orElse(null);
                if (p == null) return false;
                if (p.getPackageType() == com.sporthub.backend.enums.PackageType.VIP) return true;
                return type.equals(p.getPackageType().name()) && sportId != null && sportId.equals(p.getSportId());
            })
            .sorted(java.util.Comparator.<UserMembership, Integer>comparing(m -> {
                MembershipPackage p = membershipPackageRepository.findById(m.getPackageId()).orElseThrow();
                return p.getPackageType() == com.sporthub.backend.enums.PackageType.VIP ? 0 : 1;
            }).thenComparing(UserMembership::getEndDate).thenComparing(UserMembership::getMembershipId))
            .findFirst().orElse(null);
    }

    private boolean permitsBooking(UserMembership membership, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        if (start == null && end == null) return true;
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId()).orElse(null);
        if (pkg == null) return false;
        if (pkg.getMembershipTier() == null && (membership.getStartDate() == null || membership.getEndDate() == null
                || !List.of("ALL_DAY", "PEAK", "OFF_PEAK").contains(pkg.getAccessType()))) {
            return true;
        }
        return MembershipAccessRules.permits(pkg.getAccessType(), start, end)
                && !start.toLocalDate().isBefore(membership.getStartDate())
                && !end.toLocalDate().isAfter(membership.getEndDate());
    }

    @Transactional(readOnly = true)
    public void requireBookingAccess(Long membershipId, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        UserMembership membership = userMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy gói đã mua."));
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId()).orElseThrow();
        // Historical non-window contracts (e.g. legacy PT) retain their existing rules.
        if (pkg.getMembershipTier() == null
                && !List.of("ALL_DAY", "PEAK", "OFF_PEAK").contains(pkg.getAccessType())) return;
        if (!MembershipAccessRules.permits(pkg.getAccessType(), start, end)) {
            String windowHint = "OFF_PEAK".equals(pkg.getAccessType()) ? "08:00–16:00"
                    : "PEAK".equals(pkg.getAccessType()) ? "17:00–21:00" : "khung giờ quy định";
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Lịch ngoài khung giờ của hạng hội viên (áp dụng " + windowHint + "); chọn lịch phù hợp hoặc thanh toán lẻ.");
        }
        if (membership.getStartDate() == null || membership.getEndDate() == null
                || start.toLocalDate().isBefore(membership.getStartDate()) || end.toLocalDate().isAfter(membership.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch tập nằm ngoài thời hạn hạng hội viên.");
        }
    }

    public boolean isEffective(UserMembership m) {
        LocalDate today = LocalDate.now();
        return "ACTIVE".equals(m.getStatus()) && m.getStartDate() != null && !m.getStartDate().isAfter(today)
            && m.getEndDate() != null && !m.getEndDate().isBefore(today);
    }

    private boolean sameRenewalGroup(MembershipPackage a, MembershipPackage b) {
        String tierA = com.sporthub.backend.enums.MembershipTier.normalize(a.getMembershipTier());
        String tierB = b == null ? null : com.sporthub.backend.enums.MembershipTier.normalize(b.getMembershipTier());
        if (b != null && (tierA != null || tierB != null)) {
            return tierA != null && tierA.equalsIgnoreCase(tierB);
        }
        if (b != null && a.getPackageId() != null && b.getPackageId() != null) {
            return java.util.Objects.equals(a.getPackageId(), b.getPackageId());
        }
        return b != null && a.getPackageType() == b.getPackageType()
            && (a.getPackageType() == com.sporthub.backend.enums.PackageType.VIP || java.util.Objects.equals(a.getSportId(), b.getSportId()));
    }

    private UserMembership lockMembership(Long id) {
        UserMembership m = userMembershipRepository.findByIdForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membership không tồn tại"));
        // Quota selectors may already have loaded this row into the persistence context.
        if (entityManager != null) entityManager.refresh(m, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (m.getRemainingQuotaSessions() == null) m.setRemainingQuotaSessions(0);
        if (m.getHeldQuotaSessions() == null) m.setHeldQuotaSessions(0);
        if (m.getUsedQuotaSessions() == null) m.setUsedQuotaSessions(0);
        if (m.getInitialQuotaSessions() == null) m.setInitialQuotaSessions(0);
        if (m.getRemainingQuotaCourts() == null) m.setRemainingQuotaCourts(0);
        if (m.getHeldQuotaCourts() == null) m.setHeldQuotaCourts(0);
        if (m.getUsedQuotaCourts() == null) m.setUsedQuotaCourts(0);
        if (m.getInitialQuotaCourts() == null) m.setInitialQuotaCourts(0);
        return m;
    }

    private void requirePaid(UserMembership membership) {
        if (payments == null || payments.findFirstByMembershipIdOrderByCreatedAtDesc(membership.getMembershipId())
                .filter(p -> "PAID".equals(p.getPaymentStatus()) && membership.getUserId().equals(p.getMemberId())).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói tập chưa có giao dịch đã thanh toán hợp lệ.");
        }
    }

    public String sessionQuotaState(com.sporthub.backend.entity.Booking booking, com.sporthub.backend.enums.AttendanceStatus previous) {
        if (booking.getQuotaState() != null) return booking.getQuotaState();
        if (previous == null || previous == com.sporthub.backend.enums.AttendanceStatus.PENDING) return "HELD";
        if (previous == com.sporthub.backend.enums.AttendanceStatus.PRESENT || previous == com.sporthub.backend.enums.AttendanceStatus.UNEXCUSED_ABSENCE) return "USED";
        // A legacy EXCUSED label cannot prove whether quota was returned before or after expiry.
        return "REVIEW_REQUIRED";
    }

    @Transactional
    public void settleAttendanceQuota(com.sporthub.backend.entity.Booking booking,
            com.sporthub.backend.enums.AttendanceStatus previous, com.sporthub.backend.enums.AttendanceStatus next,
            LocalDateTime sessionStart) {
        UserMembership m = lockMembership(booking.getMembershipId());
        String state = sessionQuotaState(booking, previous);
        if (!List.of("HELD", "USED", "RELEASED", "FORFEITED").contains(state))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota lịch sử chưa xác định đã hoàn hay đã dùng; cần đối soát trước khi sửa điểm danh.");
        boolean excused = next == com.sporthub.backend.enums.AttendanceStatus.EXCUSED_ABSENCE;
        boolean refundable = isBookingWithinMembershipPeriod(m, sessionStart);
        if ("USED".equals(state) && m.getUsedQuotaSessions() < 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota lịch sử không khớp trạng thái đã dùng; cần đối soát.");
        if ("HELD".equals(state)) {
            if (m.getHeldQuotaSessions() < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking không còn quota đang giữ.");
            m.setHeldQuotaSessions(m.getHeldQuotaSessions() - 1);
            if (excused) {
                m.setRemainingQuotaSessions(m.getRemainingQuotaSessions() + 1);
                state = refundable ? "RELEASED" : "FORFEITED";
            } else { m.setUsedQuotaSessions(m.getUsedQuotaSessions() + 1); state = "USED"; }
        } else if ("USED".equals(state) && excused && refundable) {
            if (m.getUsedQuotaSessions() < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking thiếu quota đã dùng.");
            m.setUsedQuotaSessions(m.getUsedQuotaSessions() - 1); m.setRemainingQuotaSessions(m.getRemainingQuotaSessions() + 1); state = "RELEASED";
        } else if ("RELEASED".equals(state) && !excused) {
            if (refundable) {
                if (m.getRemainingQuotaSessions() < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota đã hoàn được dùng cho booking khác; cần đối soát trước khi sửa.");
                m.setRemainingQuotaSessions(m.getRemainingQuotaSessions() - 1); m.setUsedQuotaSessions(m.getUsedQuotaSessions() + 1); state = "USED";
            } else state = "FORFEITED";
        }
        // USED remains USED when an expired term cannot refund it; reversing the label is a no-op.
        validateQuotaFormula(m); booking.setQuotaState(state); userMembershipRepository.save(m);
    }

    @Transactional
    public void requireCourtCheckIn(Long membershipId, double hours) {
        UserMembership m = lockMembership(membershipId);
        if (!Double.isFinite(hours) || hours <= 0 || !isEffective(m) || m.getHeldQuotaCourts() < Math.ceil(hours))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói sân hết hiệu lực hoặc thiếu quota đang giữ; cần chuyển sang thanh toán lẻ.");
        validateCourtQuotaFormula(m);
    }

    @Transactional
    public void requireSessionCheckIn(Long membershipId) {
        UserMembership m = lockMembership(membershipId);
        if (!isEffective(m) || m.getHeldQuotaSessions() < 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói buổi học hết hiệu lực hoặc thiếu quota đang giữ.");
        validateQuotaFormula(m);
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
        if (remaining < 0 || held < 0 || used < 0 || initial < 0 || total != initial) {
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
        UserMembership membership = lockMembership(membershipId);

        if (!isEffective(membership) || quotaAmount <= 0 || membership.getRemainingQuotaSessions() < quotaAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    String.format("Không đủ quota. Còn lại: %d, cần: %d",
                            membership.getRemainingQuotaSessions(), quotaAmount));
        }

        membership.setRemainingQuotaSessions(membership.getRemainingQuotaSessions() - quotaAmount);
        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() + quotaAmount);

        validateQuotaFormula(membership);
        userMembershipRepository.save(membership);
    }

    /**
     * Trừ quota thực sự khi check-in/điểm danh PRESENT
     * held → used (đã dùng)
     */
    @Transactional
    public void consumeQuota(Long membershipId, int quotaAmount) {
        UserMembership membership = lockMembership(membershipId);

        if (quotaAmount <= 0 || membership.getHeldQuotaSessions() < quotaAmount) throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota đang giữ không đủ.");
        membership.setHeldQuotaSessions(membership.getHeldQuotaSessions() - quotaAmount);
        membership.setUsedQuotaSessions(membership.getUsedQuotaSessions() + quotaAmount);

        validateQuotaFormula(membership);
        userMembershipRepository.save(membership);
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
        UserMembership membership = lockMembership(membershipId);

        if (quotaAmount <= 0 || membership.getHeldQuotaSessions() < quotaAmount) throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota đang giữ không đủ.");
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

        validateQuotaFormula(membership);
        userMembershipRepository.save(membership);
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
        return isEffective(membership) && !bookingStartTime.toLocalDate().isAfter(membership.getEndDate());
    }

    /**
     * LUỒNG 2: Hủy membership sau khi Manager duyệt refund request
     * Gọi SAU KHI VNPay refund API thành công
     * 
     * @param membershipId ID của UserMembership cần hủy
     * @param refundId ID của RefundRequest (cho audit log)
     */
    @Transactional
    public void cancelMembershipAfterRefund(Long membershipId, Long refundId) {
        UserMembership membership = lockMembership(membershipId);

        // Chỉ cancel membership đang ACTIVE
        if ("CANCELLED".equals(membership.getStatus())) return;
        if (!List.of("ACTIVE", "PENDING_APPROVAL", "REJECTED").contains(membership.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Chỉ có thể hủy membership ở trạng thái ACTIVE. Hiện tại: %s", 
                            membership.getStatus()));
        }

        // Get package info for notification
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId())
                .orElse(null);

        // Hủy membership
        membership.setStatus("CANCELLED");

        // Xóa hết quota - revoke all privileges
        membership.setRemainingQuotaSessions(0);
        membership.setHeldQuotaSessions(0);
        membership.setRemainingQuotaCourts(0);
        membership.setHeldQuotaCourts(0);
        // used giữ nguyên (đã dùng thì đã dùng)

        // Hết hiệu lực ngay
        membership.setEndDate(LocalDate.now());

        userMembershipRepository.save(membership);

        // Send notification
        if (engagementService != null) {
            String pkgName = pkg != null ? pkg.getName() : "Gói tập";
            engagementService.notifyUser(
                membership.getUserId(),
                "Gói tập đã bị hủy do hoàn tiền",
                String.format("Gói tập '%s' của bạn đã bị hủy do yêu cầu hoàn tiền được duyệt. " +
                        "Quota và quyền lợi đã bị thu hồi. Tiền sẽ được chuyển về tài khoản trong 3-5 ngày làm việc.",
                        pkgName),
                "MEMBERSHIP_CANCELLED"
            );
        }

        // Audit log
        if (auditLogService != null) {
            String pkgName = pkg != null ? pkg.getName() : "Unknown";
            auditLogService.logSuccess(
                "MEMBERSHIP_CANCELLED_REFUND",
                String.format("RefundRequest #%d", refundId),
                membership.getMembershipId(),
                String.format("Cancelled membership #%d (Package: %s) for user #%d after refund approval. " +
                        "Quota revoked: remaining=%d, held=%d → 0. Status: ACTIVE → CANCELLED",
                        membership.getMembershipId(),
                        pkgName,
                        membership.getUserId(),
                        membership.getRemainingQuotaSessions(),
                        membership.getHeldQuotaSessions())
            );
        }
    }

    // =========================================================================
    // COURT QUOTA METHODS (Migration 002)
    // =========================================================================

    /**
     * Get active membership with sufficient COURT quota
     * @param userId User ID
     * @param requiredHours Required court hours (can be decimal, e.g., 2.5)
     * @return UserMembership nếu đủ điều kiện, null nếu không
     */
    @Transactional(readOnly = true)
    public UserMembership getActiveMembershipWithCourtQuota(Long userId, double requiredHours) {
        return getActiveMembershipWithCourtQuota(userId, requiredHours, null, null);
    }

    @Transactional(readOnly = true)
    public UserMembership getActiveMembershipWithCourtQuota(Long userId, double requiredHours,
            java.time.LocalDateTime start, java.time.LocalDateTime end) {
        List<UserMembership> memberships = userMembershipRepository.findByUserIdAndStatus(userId, "ACTIVE");

        return memberships.stream()
                .filter(this::isEffective)
                .filter(m -> permitsBooking(m, start, end))
                .filter(m -> membershipPackageRepository.findById(m.getPackageId()).map(p -> p.getPackageType() == com.sporthub.backend.enums.PackageType.VIP).orElse(false))
                .filter(m -> m.getRemainingQuotaCourts() != null && m.getRemainingQuotaCourts() >= requiredHours)
                .sorted(java.util.Comparator.comparing(UserMembership::getEndDate).thenComparing(UserMembership::getMembershipId))
                .findFirst()
                .orElse(null);
    }

    /**
     * Validate court quota formula
     */
    public void validateCourtQuotaFormula(UserMembership membership) {
        int remaining = membership.getRemainingQuotaCourts() != null ? membership.getRemainingQuotaCourts() : 0;
        int held = membership.getHeldQuotaCourts() != null ? membership.getHeldQuotaCourts() : 0;
        int used = membership.getUsedQuotaCourts() != null ? membership.getUsedQuotaCourts() : 0;
        int initial = membership.getInitialQuotaCourts() != null ? membership.getInitialQuotaCourts() : 0;

        if (remaining < 0 || held < 0 || used < 0 || initial < 0 || remaining + held + used != initial) {
            throw new IllegalStateException(String.format(
                "Court quota formula mismatch for membership %d: remaining=%d + held=%d + used=%d != initial=%d",
                membership.getMembershipId(), remaining, held, used, initial
            ));
        }
    }

    /**
     * Hold court quota on booking creation
     */
    @Transactional
    public void holdCourtQuota(Long membershipId, double hours) {
        UserMembership membership = lockMembership(membershipId);
        if (!Double.isFinite(hours) || hours <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số giờ phải lớn hơn 0.");
        int hoursInt = (int) Math.ceil(hours);
        if (!isEffective(membership) || membership.getRemainingQuotaCourts() < hoursInt) throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói không đủ quota còn hiệu lực.");
        membership.setRemainingQuotaCourts(membership.getRemainingQuotaCourts() - hoursInt);
        membership.setHeldQuotaCourts(membership.getHeldQuotaCourts() + hoursInt);
        validateCourtQuotaFormula(membership);
        userMembershipRepository.save(membership);
    }

    /**
     * Release court quota on booking cancellation
     */
    @Transactional
    public void releaseCourtQuota(Long membershipId, double hours) {
        UserMembership membership = lockMembership(membershipId);
        if (!Double.isFinite(hours) || hours <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số giờ phải lớn hơn 0.");
        int hoursInt = (int) Math.ceil(hours);
        if (membership.getHeldQuotaCourts() < hoursInt) throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota sân đang giữ không đủ.");
        membership.setHeldQuotaCourts(membership.getHeldQuotaCourts() - hoursInt);
        if (isEffective(membership)) membership.setRemainingQuotaCourts(membership.getRemainingQuotaCourts() + hoursInt);
        else membership.setUsedQuotaCourts(membership.getUsedQuotaCourts() + hoursInt);
        validateCourtQuotaFormula(membership);
        userMembershipRepository.save(membership);
    }

    /**
     * Consume court quota on check-in
     */
    @Transactional
    public void consumeCourtQuota(Long membershipId, double hours) {
        UserMembership membership = lockMembership(membershipId);
        if (!Double.isFinite(hours) || hours <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số giờ phải lớn hơn 0.");
        int hoursInt = (int) Math.ceil(hours);
        if (membership.getHeldQuotaCourts() < hoursInt) throw new ResponseStatusException(HttpStatus.CONFLICT, "Quota sân đang giữ không đủ.");
        membership.setHeldQuotaCourts(membership.getHeldQuotaCourts() - hoursInt);
        membership.setUsedQuotaCourts(membership.getUsedQuotaCourts() + hoursInt);
        validateCourtQuotaFormula(membership);
        userMembershipRepository.save(membership);
    }
}
