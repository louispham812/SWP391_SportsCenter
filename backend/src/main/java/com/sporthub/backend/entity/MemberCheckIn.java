package com.sporthub.backend.entity;

<<<<<<< HEAD
import jakarta.persistence.*;
import lombok.*;
=======
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
import java.time.LocalDateTime;

@Entity
@Table(name = "member_check_ins")
<<<<<<< HEAD
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
=======
@Getter
@Setter
@NoArgsConstructor
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
public class MemberCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "check_in_id")
    private Long checkInId;

    @Column(name = "member_id", nullable = false)
<<<<<<< HEAD
    private Long memberId; 
=======
    private Long memberId;
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad

    @Column(name = "checked_in_at", nullable = false)
    private LocalDateTime checkedInAt;

<<<<<<< HEAD
    @Column(name = "result", nullable = false, length = 20)
    private String result; // 'VALID' hoặc 'REJECTED'

    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy; 
}
=======
    @Column(nullable = false, length = 20)
    private String result;

    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy;
}
>>>>>>> a37d376adf90eb496db2786206a193e4613757ad
