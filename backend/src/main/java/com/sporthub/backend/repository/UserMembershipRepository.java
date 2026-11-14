package com.sporthub.backend.repository;

import com.sporthub.backend.entity.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from UserMembership m where m.membershipId = :id")
    java.util.Optional<UserMembership> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    boolean existsByUserIdAndPackageIdAndStatusIn(Long userId, Long packageId, List<String> statuses);
    List<UserMembership> findByUserIdOrderByEndDateDesc(Long userId);
    List<UserMembership> findByUserIdAndStatus(Long userId, String status);
    List<UserMembership> findByStatusIgnoreCase(String status);
    List<UserMembership> findByStatusIgnoreCaseAndEndDateBefore(String status, LocalDate date);
    List<UserMembership> findByStatusIgnoreCaseAndEndDate(String status, LocalDate date);
}
