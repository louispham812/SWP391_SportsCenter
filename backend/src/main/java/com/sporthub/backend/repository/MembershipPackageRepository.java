package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MembershipPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MembershipPackageRepository extends JpaRepository<MembershipPackage, Long> {
    List<MembershipPackage> findByStatus(String status);
}