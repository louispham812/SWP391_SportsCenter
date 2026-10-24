package com.sporthub.backend.repository;

import com.sporthub.backend.entity.BodyProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BodyProgressLogRepository extends JpaRepository<BodyProgressLog, Long> {
    List<BodyProgressLog> findByMemberIdOrderByRecordedDateAsc(Long memberId);
    List<BodyProgressLog> findByMemberIdOrderByRecordedDateDesc(Long memberId);
}
