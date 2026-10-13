package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "public_facilities")
@Getter
@Setter
@NoArgsConstructor
public class PublicFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Long facilityId;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 80)
    private String icon;

    @Column(length = 150)
    private String highlight;

    @Column(nullable = false)
    private boolean active;
}
