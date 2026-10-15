package com.sporthub.backend.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.AllArgsConstructor;
=======
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
<<<<<<< HEAD
@AllArgsConstructor
=======
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
<<<<<<< HEAD
    private Long facilityId;

    @Column(name = "facility_name", nullable = false)
=======
    @Column(name = "facility_id")
    private Long facilityId;

    @Column(name = "facility_name", nullable = false, length = 100)
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
    private String facilityName;

    @Column(name = "sport_id", nullable = false)
    private Long sportId;

<<<<<<< HEAD
    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status", nullable = false)
    private String status;
}
=======
    @Column(nullable = false)
    private Integer capacity;

    @Column(length = 20)
    private String status;
}
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
