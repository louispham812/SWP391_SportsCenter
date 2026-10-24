package com.sporthub.backend.service;

import com.sporthub.backend.dto.CheckInRequest;
import com.sporthub.backend.dto.CheckInResponse;
import com.sporthub.backend.entity.MemberCheckIn;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CheckInService {

    private final MemberCheckInRepository checkInRepository;
    private final UserRepository userRepository;

    public CheckInService(MemberCheckInRepository checkInRepository,
                          UserRepository userRepository) {
        this.checkInRepository = checkInRepository;
        this.userRepository = userRepository;
    }

    public CheckInResponse processCheckIn(CheckInRequest request) {
        
        User member = userRepository.findById(Long.valueOf(request.getMemberId()))
                .orElseThrow(() -> new RuntimeException("Hội viên không tồn tại!"));

        String result = "VALID";
        String message = "Check-in thành công! Thẻ hợp lệ.";

        MemberCheckIn checkIn = MemberCheckIn.builder()
                .memberId(request.getMemberId() != null ? Long.valueOf(request.getMemberId()) : null)
                .checkedInAt(LocalDateTime.now())
                .result(result)
                .recordedBy(request.getReceptionistId() != null ? Long.valueOf(request.getReceptionistId()) : 0L)
                .build();

        MemberCheckIn saved = checkInRepository.save(checkIn);

        return CheckInResponse.builder()
                .checkInId(saved.getCheckInId())
                .memberId(member.getUserId()) 
                .memberName(member.getFullName())
                .status(result)
                .message(message)
                .checkedInAt(saved.getCheckedInAt())
                .build();
    }
}