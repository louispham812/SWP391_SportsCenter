package com.sporthub.backend.service;

import com.sporthub.backend.entity.CourtMaintenance;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.repository.CourtMaintenanceRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class FacilityCourtSyncService {

    private static final Logger log = LoggerFactory.getLogger(FacilityCourtSyncService.class);

    private final FacilityRepository facilityRepository;
    private final SportsCourtRepository sportsCourtRepository;
    private final PublicFacilityRepository publicFacilityRepository;
    private final CourtMaintenanceRepository courtMaintenanceRepository;

    public FacilityCourtSyncService(
            FacilityRepository facilityRepository,
            SportsCourtRepository sportsCourtRepository,
            PublicFacilityRepository publicFacilityRepository,
            CourtMaintenanceRepository courtMaintenanceRepository) {
        this.facilityRepository = facilityRepository;
        this.sportsCourtRepository = sportsCourtRepository;
        this.publicFacilityRepository = publicFacilityRepository;
        this.courtMaintenanceRepository = courtMaintenanceRepository;
    }

    /**
     * Map facilityId -> courtId(s) based on canonical system schema and sport/court naming
     */
    public List<Long> getCourtIdsForFacility(Long facilityId, Long sportId, String facilityName) {
        List<Long> courtIds = new ArrayList<>();
        if (facilityId != null) {
            switch (facilityId.intValue()) {
                case 18, 30 -> courtIds.add(16L); // Hồ Bơi - Làn S1 <-> Làn bơi 01
                case 19, 31 -> courtIds.add(17L); // Hồ Bơi - Làn S2 <-> Làn bơi 02
                case 20, 32 -> courtIds.add(18L); // Đường Chạy Điền Kinh - Khu A1 <-> Đường chạy 01
                case 21, 33 -> courtIds.add(19L); // Đường Chạy Điền Kinh - Khu A2 <-> Đường chạy 02
                case 16, 28 -> courtIds.add(14L); // Khu Bóng Bàn - Bàn T1 <-> Bàn bóng bàn 01
                case 17, 29 -> courtIds.add(15L); // Khu Bóng Bàn - Bàn T2 <-> Bàn bóng bàn 02
                case 14, 26 -> courtIds.add(12L); // Sân Bóng Chuyền - Sân V1 <-> Sân bóng chuyền 01
                case 15, 27 -> courtIds.add(13L); // Sân Bóng Chuyền - Sân V2 <-> Sân bóng chuyền 02
                case 8, 12, 24 -> courtIds.add(10L); // Sân Cầu Lông 01
                case 9, 13, 25 -> courtIds.add(11L); // Sân Cầu Lông 02
                case 6, 10, 22 -> courtIds.add(8L);  // Sân Bóng Đá 01
                case 7, 11, 23 -> courtIds.add(9L);  // Sân Bóng Đá 02
                case 4 -> courtIds.add(3L);  // Tennis Court 01
                case 5 -> courtIds.add(4L);  // Tennis Court 02
                case 1 -> courtIds.add(1L);  // Pickleball Court 01
                case 2 -> courtIds.add(2L);  // Pickleball Court 02
                case 3 -> courtIds.addAll(List.of(1L, 2L)); // Pickleball Court 03 maps to both
            }
        }
        if (!courtIds.isEmpty()) {
            return courtIds;
        }

        if (sportId != null) {
            List<SportsCourt> courtsInSport = sportsCourtRepository.findBySportId(sportId);
            if (!courtsInSport.isEmpty()) {
                int index = extractIndex(facilityName);
                if (index > 0 && index <= courtsInSport.size()) {
                    courtIds.add(courtsInSport.get(index - 1).getCourtId());
                } else {
                    courtsInSport.forEach(c -> courtIds.add(c.getCourtId()));
                }
            }
        }
        return courtIds;
    }

    /**
     * Map courtId -> facilityId(s) based on canonical system schema and sport/facility naming
     */
    public List<Long> getFacilityIdsForCourt(Long courtId, Long sportId, String courtName) {
        List<Long> facilityIds = new ArrayList<>();
        if (courtId != null) {
            switch (courtId.intValue()) {
                case 16 -> facilityIds.addAll(List.of(18L, 30L)); // Làn bơi 01 <-> Hồ Bơi - Làn S1
                case 17 -> facilityIds.addAll(List.of(19L, 31L)); // Làn bơi 02 <-> Hồ Bơi - Làn S2
                case 18 -> facilityIds.addAll(List.of(20L, 32L)); // Đường chạy 01 <-> Khu A1
                case 19 -> facilityIds.addAll(List.of(21L, 33L)); // Đường chạy 02 <-> Khu A2
                case 14 -> facilityIds.addAll(List.of(16L, 28L)); // Bàn bóng bàn 01 <-> Khu Bàn T1
                case 15 -> facilityIds.addAll(List.of(17L, 29L)); // Bàn bóng bàn 02 <-> Khu Bàn T2
                case 12 -> facilityIds.addAll(List.of(14L, 26L)); // Sân bóng chuyền 01 <-> Sân V1
                case 13 -> facilityIds.addAll(List.of(15L, 27L)); // Sân bóng chuyền 02 <-> Sân V2
                case 10 -> facilityIds.addAll(List.of(8L, 12L, 24L)); // Sân cầu lông 01
                case 11 -> facilityIds.addAll(List.of(9L, 13L, 25L)); // Sân cầu lông 02
                case 8 -> facilityIds.addAll(List.of(6L, 10L, 22L));  // Sân bóng đá 01
                case 9 -> facilityIds.addAll(List.of(7L, 11L, 23L));  // Sân bóng đá 02
                case 3 -> facilityIds.add(4L);  // Tennis Court 01
                case 4 -> facilityIds.add(5L);  // Tennis Court 02
                case 1 -> facilityIds.addAll(List.of(1L, 3L)); // Pickleball Court 01
                case 2 -> facilityIds.add(2L);  // Pickleball Court 02
            }
        }
        if (!facilityIds.isEmpty()) {
            return facilityIds;
        }

        if (sportId != null) {
            List<Facility> facilitiesInSport = facilityRepository.findAll().stream()
                    .filter(f -> sportId.equals(f.getSportId()))
                    .sorted(Comparator.comparing(Facility::getFacilityId))
                    .toList();
            if (!facilitiesInSport.isEmpty()) {
                int index = extractIndex(courtName);
                if (index > 0 && index <= facilitiesInSport.size()) {
                    facilityIds.add(facilitiesInSport.get(index - 1).getFacilityId());
                } else {
                    facilitiesInSport.forEach(f -> facilityIds.add(f.getFacilityId()));
                }
            }
        }
        return facilityIds;
    }

    public List<Long> getPublicFacilityIdsForCourt(Long courtId, Long sportId, String courtName) {
        List<Long> ids = new ArrayList<>();
        if (courtId != null) {
            switch (courtId.intValue()) {
                case 16 -> ids.add(30L); // Làn bơi 01
                case 17 -> ids.add(31L); // Làn bơi 02
                case 18 -> ids.add(32L); // Đường chạy 01
                case 19 -> ids.add(33L); // Đường chạy 02
                case 14 -> ids.add(28L); // Bàn bóng bàn 01
                case 15 -> ids.add(29L); // Bàn bóng bàn 02
                case 12 -> ids.add(26L); // Sân bóng chuyền 01
                case 13 -> ids.add(27L); // Sân bóng chuyền 02
                case 10 -> ids.add(24L); // Sân cầu lông 01
                case 11 -> ids.add(25L); // Sân cầu lông 02
                case 8 -> ids.add(22L);  // Sân bóng đá 01
                case 9 -> ids.add(23L);  // Sân bóng đá 02
            }
        }
        return ids;
    }

    public List<Long> getPublicFacilityIdsForFacility(Long facilityId, Long sportId, String facilityName) {
        List<Long> ids = new ArrayList<>();
        if (facilityId != null) {
            switch (facilityId.intValue()) {
                case 18, 30 -> ids.add(30L); // Hồ bơi 01
                case 19, 31 -> ids.add(31L); // Hồ bơi 02
                case 20, 32 -> ids.add(32L); // Điền kinh 01
                case 21, 33 -> ids.add(33L); // Điền kinh 02
                case 16, 28 -> ids.add(28L); // Bóng bàn 01
                case 17, 29 -> ids.add(29L); // Bóng bàn 02
                case 14, 26 -> ids.add(26L); // Bóng chuyền 01
                case 15, 27 -> ids.add(27L); // Bóng chuyền 02
                case 8, 12, 24 -> ids.add(24L); // Cầu lông 01
                case 9, 13, 25 -> ids.add(25L); // Cầu lông 02
                case 6, 10, 22 -> ids.add(22L); // Bóng đá 01
                case 7, 11, 23 -> ids.add(23L); // Bóng đá 02
            }
        }
        if (facilityId != null && publicFacilityRepository.existsById(facilityId)) {
            ids.add(facilityId);
        }
        return ids.stream().distinct().toList();
    }

    public List<Long> getSiblingFacilityIds(Long facilityId, Long sportId, String facilityName) {
        List<Long> siblings = new ArrayList<>();
        if (facilityId != null) {
            siblings.add(facilityId);
            switch (facilityId.intValue()) {
                case 18, 30 -> siblings.addAll(List.of(18L, 30L));
                case 19, 31 -> siblings.addAll(List.of(19L, 31L));
                case 20, 32 -> siblings.addAll(List.of(20L, 32L));
                case 21, 33 -> siblings.addAll(List.of(21L, 33L));
                case 16, 28 -> siblings.addAll(List.of(16L, 28L));
                case 17, 29 -> siblings.addAll(List.of(17L, 29L));
                case 14, 26 -> siblings.addAll(List.of(14L, 26L));
                case 15, 27 -> siblings.addAll(List.of(15L, 27L));
                case 8, 12, 24 -> siblings.addAll(List.of(8L, 12L, 24L));
                case 9, 13, 25 -> siblings.addAll(List.of(9L, 13L, 25L));
                case 6, 10, 22 -> siblings.addAll(List.of(6L, 10L, 22L));
                case 7, 11, 23 -> siblings.addAll(List.of(7L, 11L, 23L));
                case 1, 3 -> siblings.addAll(List.of(1L, 3L));
            }
        }
        return siblings.stream().distinct().toList();
    }

    private int extractIndex(String text) {
        if (text == null) return 0;
        String lower = text.toLowerCase();
        if (lower.contains("01") || lower.contains("s1") || lower.contains("p1") || lower.contains("t1") || lower.contains("f1") || lower.contains("l1") || lower.contains("v1") || lower.contains("a1") || lower.contains("sân a") || lower.contains("bàn t1") || lower.contains("làn 1") || lower.contains("court 01") || lower.contains("studio 01")) {
            return 1;
        }
        if (lower.contains("02") || lower.contains("s2") || lower.contains("p2") || lower.contains("t2") || lower.contains("f2") || lower.contains("l2") || lower.contains("v2") || lower.contains("a2") || lower.contains("sân b") || lower.contains("bàn t2") || lower.contains("làn 2") || lower.contains("court 02") || lower.contains("studio 02")) {
            return 2;
        }
        if (lower.contains("03") || lower.contains("s3") || lower.contains("p3") || lower.contains("3")) {
            return 3;
        }
        return 0;
    }

    /**
     * Triggered when Manager updates Facility status (AVAILABLE / MAINTENANCE)
     */
    @Transactional
    public void syncFromFacility(Long facilityId, String status) {
        Facility facility = facilityRepository.findById(facilityId).orElse(null);
        if (facility == null) return;
        boolean isAvailable = "AVAILABLE".equalsIgnoreCase(status);

        // 1. Sync target facility and sibling duplicates in facilities table
        List<Long> siblingFacilityIds = getSiblingFacilityIds(facilityId, facility.getSportId(), facility.getFacilityName());
        for (Long sId : siblingFacilityIds) {
            facilityRepository.findById(sId).ifPresent(f -> {
                f.setStatus(status);
                facilityRepository.save(f);
            });
        }

        // 2. Sync to public_facilities
        List<Long> pfIds = getPublicFacilityIdsForFacility(facilityId, facility.getSportId(), facility.getFacilityName());
        for (Long pfId : pfIds) {
            publicFacilityRepository.findById(pfId).ifPresent(pf -> {
                pf.setActive(isAvailable);
                publicFacilityRepository.save(pf);
            });
        }

        // 3. Sync to sports_courts
        List<Long> courtIds = getCourtIdsForFacility(facilityId, facility.getSportId(), facility.getFacilityName());
        LocalDateTime now = LocalDateTime.now();
        for (Long courtId : courtIds) {
            sportsCourtRepository.findById(courtId).ifPresent(court -> {
                court.setActive(isAvailable);
                sportsCourtRepository.save(court);

                if (!isAvailable) {
                    boolean hasActive = courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                            courtId, now.plusMonths(1), now.minusMinutes(1));
                    if (!hasActive) {
                        courtMaintenanceRepository.save(CourtMaintenance.builder()
                                .courtId(courtId)
                                .startTime(now.minusMinutes(5))
                                .endTime(now.plusMonths(1))
                                .reason("Bảo trì cơ sở bãi theo chỉ định Ban Quản Lý (" + facility.getFacilityName() + ")")
                                .createdBy(1L)
                                .createdAt(now)
                                .build());
                    }
                } else {
                    List<CourtMaintenance> list = courtMaintenanceRepository.findByCourtId(courtId);
                    for (CourtMaintenance m : list) {
                        if (m.getEndTime().isAfter(now)) {
                            courtMaintenanceRepository.delete(m);
                        }
                    }
                }
            });
        }
        log.info("Synced facility {} ({}) -> status: {}, siblings: {}, publicFacilities: {}, courts affected: {}",
                facilityId, facility.getFacilityName(), status, siblingFacilityIds, pfIds, courtIds);
    }

    /**
     * Triggered when Manager directly updates Court active flag
     */
    @Transactional
    public void syncFromCourt(Long courtId, boolean active) {
        SportsCourt court = sportsCourtRepository.findById(courtId).orElse(null);
        if (court == null) return;
        court.setActive(active);
        sportsCourtRepository.save(court);

        String status = active ? "AVAILABLE" : "MAINTENANCE";
        List<Long> facilityIds = getFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
        for (Long facId : facilityIds) {
            facilityRepository.findById(facId).ifPresent(f -> {
                f.setStatus(status);
                facilityRepository.save(f);
            });
        }

        List<Long> pfIds = getPublicFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
        for (Long pfId : pfIds) {
            publicFacilityRepository.findById(pfId).ifPresent(pf -> {
                pf.setActive(active);
                publicFacilityRepository.save(pf);
            });
        }

        LocalDateTime now = LocalDateTime.now();
        if (!active) {
            boolean hasActive = courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(
                    courtId, now.plusMonths(1), now.minusMinutes(1));
            if (!hasActive) {
                courtMaintenanceRepository.save(CourtMaintenance.builder()
                        .courtId(courtId)
                        .startTime(now.minusMinutes(5))
                        .endTime(now.plusMonths(1))
                        .reason("Bảo trì sân đấu theo chỉ định (" + court.getCourtName() + ")")
                        .createdBy(1L)
                        .createdAt(now)
                        .build());
            }
        } else {
            List<CourtMaintenance> list = courtMaintenanceRepository.findByCourtId(courtId);
            for (CourtMaintenance m : list) {
                if (m.getEndTime().isAfter(now)) {
                    courtMaintenanceRepository.delete(m);
                }
            }
        }

        log.info("Synced court {} ({}) -> active: {}, facilities affected: {}, publicFacilities: {}", courtId, court.getCourtName(), active, facilityIds, pfIds);
    }

    /**
     * Triggered when Manager creates a maintenance schedule window
     */
    @Transactional
    public void syncFromMaintenanceCreate(Long courtId, LocalDateTime start, LocalDateTime end, String reason) {
        SportsCourt court = sportsCourtRepository.findById(courtId).orElse(null);
        if (court == null) return;

        LocalDateTime now = LocalDateTime.now();
        // If maintenance window covers the current moment or is active
        if (!now.isBefore(start) && !now.isAfter(end)) {
            court.setActive(false);
            sportsCourtRepository.save(court);
        }

        List<Long> facilityIds = getFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
        for (Long facId : facilityIds) {
            facilityRepository.findById(facId).ifPresent(f -> {
                f.setStatus("MAINTENANCE");
                facilityRepository.save(f);
            });
        }

        List<Long> pfIds = getPublicFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
        for (Long pfId : pfIds) {
            publicFacilityRepository.findById(pfId).ifPresent(pf -> {
                pf.setActive(false);
                publicFacilityRepository.save(pf);
            });
        }
        log.info("Synced maintenance create for court {} -> facilities affected: {}, publicFacilities: {}", courtId, facilityIds, pfIds);
    }

    /**
     * Triggered when Manager deletes a maintenance schedule
     */
    @Transactional
    public void syncFromMaintenanceDelete(Long courtId) {
        if (courtId == null) return;
        LocalDateTime now = LocalDateTime.now();
        List<CourtMaintenance> activeMaintenances = courtMaintenanceRepository.findByCourtIdAndEndTimeAfter(courtId, now);
        if (activeMaintenances.isEmpty()) {
            sportsCourtRepository.findById(courtId).ifPresent(court -> {
                court.setActive(true);
                sportsCourtRepository.save(court);

                List<Long> facilityIds = getFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
                for (Long facId : facilityIds) {
                    facilityRepository.findById(facId).ifPresent(f -> {
                        f.setStatus("AVAILABLE");
                        facilityRepository.save(f);
                    });
                }

                List<Long> pfIds = getPublicFacilityIdsForCourt(courtId, court.getSportId(), court.getCourtName());
                for (Long pfId : pfIds) {
                    publicFacilityRepository.findById(pfId).ifPresent(pf -> {
                        pf.setActive(true);
                        publicFacilityRepository.save(pf);
                    });
                }
                log.info("Synced maintenance delete for court {} -> restored facilities: {}, publicFacilities: {}", courtId, facilityIds, pfIds);
            });
        }
    }
}
