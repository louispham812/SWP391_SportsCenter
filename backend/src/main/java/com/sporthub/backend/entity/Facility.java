package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Integer facilityId;

    @Column(name = "facility_name")
    private String facilityName;

    @Column(name = "sport_id")
    private Integer sportId;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "status")
    private String status;
}