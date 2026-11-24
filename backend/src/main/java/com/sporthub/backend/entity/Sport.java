package com.sporthub.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

@Entity
@Table(name = "sports")
@Getter
@Setter
@NoArgsConstructor
public class Sport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sport_id")
    private Long sportId;

    @Column(name = "sport_name", nullable = false, length = 50)
    private String sportName;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @JsonProperty("name")
    public String getName() {
        return sportName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Sport other)) return false;
        return sportId != null && Objects.equals(sportId, other.sportId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
