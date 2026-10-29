package com.sporthub.backend.repository;

import com.sporthub.backend.entity.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {
    List<UserMembership> findByUserIdOrderByEndDateDesc(Long userId);
    List<UserMembership> findByUserIdAndStatus(Long userId, String status);
    List<UserMembership> findByStatusIgnoreCase(String status);
    List<UserMembership> findByStatusIgnoreCaseAndEndDateBefore(String status, LocalDate date);
    List<UserMembership> findByStatusIgnoreCaseAndEndDate(String status, LocalDate date);
}
