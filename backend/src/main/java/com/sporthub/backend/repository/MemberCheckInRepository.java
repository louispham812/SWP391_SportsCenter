package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MemberCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberCheckInRepository extends JpaRepository<MemberCheckIn, Long> {
    List<MemberCheckIn> findTop50ByOrderByCheckedInAtDesc();
    List<MemberCheckIn> findByMemberIdOrderByCheckedInAtDesc(Long memberId);
}
