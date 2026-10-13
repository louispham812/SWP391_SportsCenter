package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Long facilityId;

    @Column(name = "facility_name", nullable = false, length = 100)
    private String facilityName;

    @Column(name = "sport_id", nullable = false)
    private Long sportId;

    @Column(nullable = false)
    private Integer capacity;

    @Column(length = 20)
    private String status;
}
