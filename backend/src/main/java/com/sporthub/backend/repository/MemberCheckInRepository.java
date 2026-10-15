package com.sporthub.backend.repository;

import com.sporthub.backend.entity.MemberCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberCheckInRepository extends JpaRepository<MemberCheckIn, Long> {
    List<MemberCheckIn> findByMemberIdOrderByCheckedInAtDesc(Integer memberId);
}
=======

import java.util.List;

public interface MemberCheckInRepository extends JpaRepository<MemberCheckIn, Long> {
    List<MemberCheckIn> findTop50ByOrderByCheckedInAtDesc();
    List<MemberCheckIn> findByMemberIdOrderByCheckedInAtDesc(Long memberId);
}
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
