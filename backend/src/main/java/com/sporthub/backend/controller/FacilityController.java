package com.sporthub.backend.controller;

import com.sporthub.backend.dto.FacilityDTO;
import com.sporthub.backend.service.FacilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/facilities")
@CrossOrigin(origins = "*")
public class FacilityController {

    @Autowired
    private FacilityService facilityService;

    @GetMapping("/available")
public ResponseEntity<List<FacilityDTO>> getAvailableFacilities(
        @RequestParam(required = false) Long sportId) {
    List<FacilityDTO> availableFacilities = facilityService.getAvailableFacilities(sportId);
    return ResponseEntity.ok(availableFacilities);
}
}