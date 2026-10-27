package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MemberHealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MemberHealthProfileRepository extends JpaRepository<MemberHealthProfile, Long> {
    Optional<MemberHealthProfile> findByMemberId(Long memberId);
    List<MemberHealthProfile> findByMemberIdIn(List<Long> memberIds);
}
