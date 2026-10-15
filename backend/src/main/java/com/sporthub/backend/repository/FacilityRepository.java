package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
<<<<<<< HEAD

    List<Facility> findBySportIdAndStatus(Long sportId, String status);

    List<Facility> findByStatus(String status);

    List<Facility> findAllByOrderByFacilityIdAsc();
}
=======
    List<Facility> findAllByOrderByFacilityIdAsc();
}
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
