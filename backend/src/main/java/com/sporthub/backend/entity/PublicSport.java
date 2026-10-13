package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "public_sports")
@Getter
@Setter
@NoArgsConstructor
public class PublicSport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sport_id")
    private Long sportId;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 150)
    private String subtitle;

    @Column(length = 80)
    private String tag;

    @Column(length = 1000)
    private String description;

    @Column(length = 80)
    private String icon;

    @Column(length = 150)
    private String area;

    @Column(nullable = false)
    private boolean active;
}
