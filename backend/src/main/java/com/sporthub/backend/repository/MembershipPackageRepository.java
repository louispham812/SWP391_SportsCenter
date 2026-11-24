package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MembershipPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MembershipPackageRepository extends JpaRepository<MembershipPackage, Long> {
    boolean existsByMembershipTierIgnoreCaseAndStatusAndPackageIdNot(String tier, String status, Long packageId);
    boolean existsByNameIgnoreCaseAndStatusAndPackageIdNot(String name, String status, Long packageId);
    List<MembershipPackage> findByStatus(String status);
    List<MembershipPackage> findAllByOrderByPackageIdDesc();
}
