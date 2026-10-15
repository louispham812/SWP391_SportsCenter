package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long facilityId;

    @Column(name = "facility_name", nullable = false)
    private String facilityName;

    @Column(name = "sport_id", nullable = false)
    private Long sportId;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status", nullable = false)
    private String status;
}
