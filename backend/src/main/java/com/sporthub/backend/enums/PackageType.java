package com.sporthub.backend.enums;

/**
 * Loại gói tập theo DATABASE_SCHEMA_SPECIFICATION.md Section 2.2
 * - VIP: Gói không giới hạn tập, chỉ tính số buổi check-in
 * - PT: Gói Personal Training 1-1
 * - CLASS: Gói lớp học nhóm
 */
public enum PackageType {
    VIP,    // Gói VIP không giới hạn
    PT,     // Gói PT 1-1
    CLASS   // Gói lớp học nhóm
}
