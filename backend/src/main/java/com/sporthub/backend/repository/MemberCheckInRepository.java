package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MemberCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MemberCheckInRepository extends JpaRepository<MemberCheckIn, Long> {
    List<MemberCheckIn> findTop50ByOrderByCheckedInAtDesc();
    List<MemberCheckIn> findByMemberIdOrderByCheckedInAtDesc(Long memberId);
    boolean existsByMemberIdAndCheckedInAtAfter(Long memberId, LocalDateTime after);
    long countByRecordedBy(Long recordedBy);
    long countByCheckedInAtGreaterThanEqualAndCheckedInAtLessThan(LocalDateTime start, LocalDateTime end);
    long countByResultAndCheckedInAtGreaterThanEqualAndCheckedInAtLessThan(String result, LocalDateTime start, LocalDateTime end);
}

