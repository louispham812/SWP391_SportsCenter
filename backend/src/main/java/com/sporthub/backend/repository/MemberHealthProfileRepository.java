package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MemberHealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberHealthProfileRepository extends JpaRepository<MemberHealthProfile, Long> {
    Optional<MemberHealthProfile> findByMemberId(Long memberId);
}
