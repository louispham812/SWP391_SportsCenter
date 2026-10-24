package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateClassSessionRequest;
import com.sporthub.backend.dto.FacilityStatusRequest;
import com.sporthub.backend.dto.ManagerFacilityResponse;
import com.sporthub.backend.dto.UpdateClassSessionRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/manager")
@CrossOrigin(origins = "*")
public class FacilityManagementController {

    private final FacilityRepository facilityRepository;
    private final SportRepository sportRepository;
    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BookingRepository bookingRepository;
    private final EngagementService engagementService;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    public FacilityManagementController(
            FacilityRepository facilityRepository,
            SportRepository sportRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository,
            BookingRepository bookingRepository,
            EngagementService engagementService,
            PaymentTransactionRepository paymentTransactionRepository) {
        this.facilityRepository = facilityRepository;
        this.sportRepository = sportRepository;
        this.userRepository = userRepository;
        this.classSessionRepository = classSessionRepository;
        this.bookingRepository = bookingRepository;
        this.engagementService = engagementService;
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    public FacilityManagementController(
            FacilityRepository facilityRepository,
            SportRepository sportRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository) {
        this(facilityRepository, sportRepository, userRepository, classSessionRepository, null, null, null);
    }

    @GetMapping("/facilities")
    @Transactional(readOnly = true)
    public List<ManagerFacilityResponse> getFacilities(Authentication authentication) {
        requireManager(authentication);
        var sports = sportRepository.findAllByOrderBySportIdAsc().stream()
                .collect(Collectors.toMap(Sport::getSportId, Sport::getSportName));
        return facilityRepository.findAllByOrderByFacilityIdAsc().stream()
                .map(facility -> new ManagerFacilityResponse(
                        facility.getFacilityId(),
                        facility.getFacilityName(),
                        facility.getSportId(),
                        sports.get(facility.getSportId()),
                        facility.getCapacity(),
                        facility.getStatus()))
                .toList();
    }

    @GetMapping("/domain-sports")
    @Transactional(readOnly = true)
    public List<Sport> getSports(Authentication authentication) {
        requireManager(authentication);
        return sportRepository.findAllByOrderBySportIdAsc();
    }

    @PatchMapping("/facilities/{facilityId}/status")
    @Transactional
    public ManagerFacilityResponse updateFacilityStatus(
            @PathVariable Long facilityId,
            @RequestBody FacilityStatusRequest request,
            Authentication authentication) {
        requireManager(authentication);
        if (!Set.of("AVAILABLE", "MAINTENANCE").contains(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái cơ sở không hợp lệ.");
        }
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cơ sở."));
        facility.setStatus(request.status());
        facilityRepository.save(facility);
        String sportName = sportRepository.findById(facility.getSportId())
                .map(Sport::getSportName)
                .orElse(null);
        return new ManagerFacilityResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                facility.getSportId(),
                sportName,
                facility.getCapacity(),
                facility.getStatus());
    }

    @PostMapping("/class-sessions")
    @Transactional
    public List<ClassSession> createClassSession(
            @RequestBody CreateClassSessionRequest request,
            Authentication authentication) {
        requireManager(authentication);
        validateSession(request);
        Facility facility = facilityRepository.findById(request.facilityId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cơ sở không tồn tại."));
        if (!facility.getSportId().equals(request.sportId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Môn thể thao không phù hợp với cơ sở.");
        }
        sportRepository.findById(request.sportId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Môn thể thao không tồn tại."));
        User coach = userRepository.findById(request.coachId())
                .filter(user -> "COACH".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Huấn luyện viên không tồn tại."));
        if (!"AVAILABLE".equalsIgnoreCase(facility.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cơ sở đang bảo trì.");
        }

        List<ClassSession> existingCoachSessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coach.getUserId());
        List<ClassSession> allSessions = classSessionRepository.findAll();

        for (int index = 0; index < request.sessionCount(); index++) {
            LocalDateTime start = request.startTime().plusWeeks(index);
            LocalDateTime end = request.endTime().plusWeeks(index);

            boolean coachConflict = existingCoachSessions.stream()
                    .anyMatch(existing -> !"CANCELLED".equalsIgnoreCase(existing.getStatus())
                            && start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime()));
            if (coachConflict) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Huấn luyện viên đã có ca dạy khác bị trùng giờ trong khung giờ này.");
            }

            boolean facilityConflict = allSessions.stream()
                    .anyMatch(existing -> !"CANCELLED".equalsIgnoreCase(existing.getStatus())
                            && existing.getFacilityId().equals(request.facilityId())
                            && start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime()));
            if (facilityConflict) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Cơ sở / sân bãi đã được xếp lịch lớp khác bị trùng giờ trong khung giờ này.");
            }
        }

        List<ClassSession> sessions = new ArrayList<>(request.sessionCount());
        for (int index = 0; index < request.sessionCount(); index++) {
            ClassSession session = new ClassSession();
            session.setClassName(request.className().trim());
            session.setSportId(request.sportId());
            session.setCoachId(coach.getUserId());
            session.setFacilityId(request.facilityId());
            session.setStartTime(request.startTime().plusWeeks(index));
            session.setEndTime(request.endTime().plusWeeks(index));
            session.setMaxSlots(request.maxSlots());
            session.setBookedSlots(0);
            session.setPriceAmount(request.priceAmount() == null ? BigDecimal.ZERO : request.priceAmount());
            session.setStatus("SCHEDULED");
            sessions.add(session);
        }
        return classSessionRepository.saveAll(sessions);
    }

    @GetMapping("/class-sessions")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllClassSessions(Authentication authentication) {
        requireManager(authentication);
        List<ClassSession> sessions = classSessionRepository.findAll();
        Map<Long, String> coachNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getUserId, User::getFullName, (a, b) -> a));
        Map<Long, String> facilityNames = facilityRepository.findAll().stream()
                .collect(Collectors.toMap(Facility::getFacilityId, Facility::getFacilityName, (a, b) -> a));
        Map<Long, String> sportNames = sportRepository.findAll().stream()
                .collect(Collectors.toMap(Sport::getSportId, Sport::getSportName, (a, b) -> a));

        return sessions.stream()
                .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                .map(s -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("sessionId", s.getSessionId());
                    map.put("className", s.getClassName());
                    map.put("sportId", s.getSportId());
                    map.put("sportName", sportNames.getOrDefault(s.getSportId(), "Thể thao"));
                    map.put("coachId", s.getCoachId());
                    map.put("coachName", coachNames.getOrDefault(s.getCoachId(), "HLV"));
                    map.put("facilityId", s.getFacilityId());
                    map.put("facilityName", facilityNames.getOrDefault(s.getFacilityId(), "Phòng/Sân"));
                    map.put("startTime", s.getStartTime());
                    map.put("endTime", s.getEndTime());
                    map.put("maxSlots", s.getMaxSlots());
                    map.put("bookedSlots", s.getBookedSlots());
                    map.put("priceAmount", s.getPriceAmount());
                    map.put("status", s.getStatus());
                    return map;
                })
                .toList();
    }

    @PutMapping("/class-sessions/{sessionId}")
    @Transactional
    public ClassSession updateClassSession(
            @PathVariable Long sessionId,
            @RequestBody UpdateClassSessionRequest request,
            Authentication authentication) {
        requireManager(authentication);
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca học."));

        if (request.className() != null && !request.className().isBlank()) {
            session.setClassName(request.className().trim());
        }
        if (request.coachId() != null) {
            userRepository.findById(request.coachId())
                    .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Huấn luyện viên không hợp lệ."));
            session.setCoachId(request.coachId());
        }
        if (request.facilityId() != null) {
            facilityRepository.findById(request.facilityId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cơ sở không hợp lệ."));
            session.setFacilityId(request.facilityId());
        }
        if (request.startTime() != null && request.endTime() != null) {
            if (!request.endTime().isAfter(request.startTime())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu.");
            }
            session.setStartTime(request.startTime());
            session.setEndTime(request.endTime());
        }
        if (request.maxSlots() != null && request.maxSlots() > 0) {
            session.setMaxSlots(request.maxSlots());
        }
        if (request.priceAmount() != null) {
            session.setPriceAmount(request.priceAmount());
        }
        if (request.status() != null && !request.status().isBlank()) {
            session.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
        }

        ClassSession saved = classSessionRepository.save(session);

        // MGR-08: Tự động gửi thông báo cho HLV và các Member đã đặt
        if (engagementService != null) {
            String noticeMsg = "Ca học '" + saved.getClassName() + "' đã được cập nhật lịch mới: "
                    + saved.getStartTime().toString().replace("T", " ") + " - " + saved.getEndTime().toString().replace("T", " ") + ".";
            engagementService.notifyUser(saved.getCoachId(), "Cập Nhật Ca Dạy: " + saved.getClassName(), noticeMsg, "COACH");

            if (bookingRepository != null) {
                List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(List.of(sessionId), List.of("BOOKED", "CONFIRMED"));
                for (Booking b : bookings) {
                    engagementService.notifyUser(b.getMemberId(), "Thay Đổi Lịch Ca Học: " + saved.getClassName(),
                            "Lớp học '" + saved.getClassName() + "' của bạn đã được cập nhật lịch mới lúc "
                                    + saved.getStartTime().toString().replace("T", " ") + ". Vui lòng kiểm tra lại thời khóa biểu.", "MEMBER");
                }
            }
        }

        return saved;
    }

    @DeleteMapping("/class-sessions/{sessionId}")
    @Transactional
    public Map<String, Object> cancelClassSession(
            @PathVariable Long sessionId,
            @RequestParam(required = false, defaultValue = "Lý do vận hành trung tâm") String reason,
            Authentication authentication) {
        requireManager(authentication);
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca học."));

        session.setStatus("CANCELLED");
        classSessionRepository.save(session);

        // MGR-08: Tự động gửi thông báo hủy cho HLV và học viên
        if (engagementService != null) {
            String coachMsg = "Ca dạy '" + session.getClassName() + "' vào lúc "
                    + session.getStartTime().toString().replace("T", " ") + " đã bị hủy bởi Quản lý. Lý do: " + reason;
            engagementService.notifyUser(session.getCoachId(), "Hủy Ca Dạy: " + session.getClassName(), coachMsg, "COACH");

            if (bookingRepository != null) {
                List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(List.of(sessionId), List.of("BOOKED", "CONFIRMED"));
                for (Booking b : bookings) {
                    b.setStatus("CANCELLED");
                    bookingRepository.save(b);

                    if (paymentTransactionRepository != null && b.getPaymentId() != null) {
                        paymentTransactionRepository.findById(b.getPaymentId()).ifPresent(orig -> {
                            orig.setPaymentStatus("REFUNDED");
                            paymentTransactionRepository.save(orig);
                        });
                    }

                    engagementService.notifyUser(b.getMemberId(), "Thông Báo Hủy Lớp Học: " + session.getClassName(),
                            "Lớp học '" + session.getClassName() + "' vào lúc " + session.getStartTime().toString().replace("T", " ")
                                    + " đã bị hủy. Học phí/lượt học của bạn đã được hoàn lại. Lý do: " + reason, "MEMBER");
                }
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("sessionId", sessionId);
        res.put("status", "CANCELLED");
        res.put("cancelled", true);
        res.put("reason", reason);
        return res;
    }

    private void validateSession(CreateClassSessionRequest request) {
        if (request.sessionCount() == null || request.sessionCount() < 1 || request.sessionCount() > 52) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số buổi học phải từ 1 đến 52.");
        }
        if (request.className() == null || request.className().isBlank() || request.className().length() > 100
                || request.sportId() == null || request.coachId() == null || request.facilityId() == null
                || request.startTime() == null || request.endTime() == null
                || !request.endTime().isAfter(request.startTime())
                || request.startTime().isBefore(LocalDateTime.now())
                || request.maxSlots() == null || request.maxSlots() < 1
                || (request.priceAmount() != null && request.priceAmount().signum() < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin lịch lớp không hợp lệ.");
        }
    }

    private void requireManager(Authentication authentication) {
        boolean isManager = authentication != null && authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .anyMatch(Set.of("ROLE_MANAGER", "ROLE_ADMIN")::contains);
        if (!isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản lý mới được truy cập chức năng này.");
        }
    }
}
