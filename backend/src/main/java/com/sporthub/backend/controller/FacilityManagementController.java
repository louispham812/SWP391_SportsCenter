package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateClassSessionRequest;
import com.sporthub.backend.dto.FacilityStatusRequest;
import com.sporthub.backend.dto.ManagerFacilityResponse;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/manager")
@CrossOrigin(origins = "*")
public class FacilityManagementController {

    private final FacilityRepository facilityRepository;
    private final SportRepository sportRepository;
    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;

    public FacilityManagementController(
            FacilityRepository facilityRepository,
            SportRepository sportRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository) {
        this.facilityRepository = facilityRepository;
        this.sportRepository = sportRepository;
        this.userRepository = userRepository;
        this.classSessionRepository = classSessionRepository;
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
