package com.sporthub.backend.service;

import com.sporthub.backend.dto.FacilityDTO;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.repository.FacilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacilityService {

    @Autowired
    private FacilityRepository facilityRepository;

    public List<FacilityDTO> getAvailableFacilities(Long sportId) {
    List<Facility> facilities;
    if (sportId != null) {
        facilities = facilityRepository.findBySportIdAndStatus(sportId, "AVAILABLE");
    } else {
        facilities = facilityRepository.findByStatus("AVAILABLE");
    }
    
    return facilities.stream().map(f -> FacilityDTO.builder()
            .facilityId(f.getFacilityId())
            .facilityName(f.getFacilityName())
            .sportId(f.getSportId())
            .capacity(f.getCapacity())
            .status(f.getStatus())
            .build()
    ).collect(Collectors.toList());
}
}