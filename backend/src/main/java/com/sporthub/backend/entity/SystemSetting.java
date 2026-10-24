package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemSetting {

    @Id
    @Column(name = "setting_key", length = 60, nullable = false)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "NVARCHAR(MAX)")
    private String settingValue;

    @Builder.Default
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
