package com.sporthub.backend.repository;

import com.sporthub.backend.entity.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {
    List<UserMembership> findByUserIdOrderByEndDateDesc(Long userId);
}
