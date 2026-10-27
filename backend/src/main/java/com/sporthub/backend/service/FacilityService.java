package com.sporthub.backend.service;

import com.sporthub.backend.dto.FacilityDTO;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final PublicSportRepository publicSportRepository;

    public List<FacilityDTO> getAvailableFacilities(Long sportId) {
        // 1. Lấy danh sách facilities
        List<Facility> facilities;
        if (sportId != null) {
            facilities = facilityRepository.findBySportIdAndStatus(sportId, "AVAILABLE");
        } else {
            facilities = facilityRepository.findByStatus("AVAILABLE");
        }
        
        // 2. Lấy tất cả sport IDs từ facilities
        List<Long> sportIds = facilities.stream()
                .map(Facility::getSportId)
                .distinct()
                .toList();
        
        // 3. Load tất cả sports để map sportName (N+1 query prevention)
        Map<Long, PublicSport> sportsMap = publicSportRepository.findAllById(sportIds)
                .stream()
                .collect(Collectors.toMap(PublicSport::getSportId, Function.identity()));
        
        // 4. Map sang DTO với sportName
        return facilities.stream()
                .map(f -> {
                    PublicSport sport = sportsMap.get(f.getSportId());
                    return FacilityDTO.builder()
                            .facilityId(f.getFacilityId())
                            .facilityName(f.getFacilityName())
                            .sportId(f.getSportId())
                            .sportName(sport != null ? sport.getName() : null)
                            .capacity(f.getCapacity())
                            .status(f.getStatus())
                            .build();
                })
                .collect(Collectors.toList());
    }
}