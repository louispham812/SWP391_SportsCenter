package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CheckInRequest;
import com.sporthub.backend.dto.CheckInResponse;
import com.sporthub.backend.service.CheckInService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reception")
@CrossOrigin(origins = "*")
public class CheckInController {

    @Autowired
    private CheckInService checkInService;

    @PostMapping("/check-in")
    public ResponseEntity<CheckInResponse> checkIn(@RequestBody CheckInRequest request) {
        CheckInResponse response = checkInService.processCheckIn(request);
        return ResponseEntity.ok(response);
    }
}