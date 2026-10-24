package com.sporthub.backend.repository;

import com.sporthub.backend.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
