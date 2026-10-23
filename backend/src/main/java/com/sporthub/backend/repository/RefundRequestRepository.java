package com.sporthub.backend.repository;

import com.sporthub.backend.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    List<RefundRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<RefundRequest> findAllByOrderByCreatedAtDesc();
}
