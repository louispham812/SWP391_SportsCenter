package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SportRepository extends JpaRepository<Sport, Long> {
    List<Sport> findAllByOrderBySportIdAsc();
}
