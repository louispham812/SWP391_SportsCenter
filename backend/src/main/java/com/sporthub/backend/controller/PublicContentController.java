package com.sporthub.backend.controller;

import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/content")
@CrossOrigin(origins = "*")
public class PublicContentController {

    private final PublicSportRepository sportRepository;
    private final PublicFacilityRepository facilityRepository;

    public PublicContentController(
            PublicSportRepository sportRepository,
            PublicFacilityRepository facilityRepository) {
        this.sportRepository = sportRepository;
        this.facilityRepository = facilityRepository;
    }

    @GetMapping("/sports")
    public List<PublicSport> getSports() {
        return sportRepository.findByActiveTrueOrderBySportIdAsc();
    }

    @GetMapping("/facilities")
    public List<PublicFacility> getFacilities() {
        return facilityRepository.findByActiveTrueOrderByFacilityIdAsc();
    }
}
