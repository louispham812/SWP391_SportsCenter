package com.sporthub.backend.enums;

import com.sporthub.backend.entity.MembershipPackage;
import java.util.Collection;
import java.util.Locale;
import java.util.Optional;

public enum MembershipTier {
    BRONZE("Hạng Đồng"), SILVER("Hạng Bạc"), GOLD("Hạng Vàng"), DIAMOND("Hạng Kim Cương");

    private final String displayName;

    MembershipTier(String displayName) { this.displayName = displayName; }

    public String getDisplayName() { return displayName; }

    public static Optional<MembershipTier> fromString(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        String trimmed = value.trim();
        for (MembershipTier tier : values()) {
            if (tier.name().equalsIgnoreCase(trimmed) || tier.displayName.equalsIgnoreCase(trimmed)) {
                return Optional.of(tier);
            }
        }
        return Optional.empty();
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return fromString(value).map(Enum::name).orElseGet(value::trim);
    }

    public static int rank(String value) {
        return fromString(value).map(tier -> tier.ordinal() + 1).orElse(0);
    }

    public record TierDisplay(String tier, String tierBadge) {}

    public static TierDisplay resolveDisplay(Collection<MembershipPackage> packages, String emptyTier, String emptyBadge) {
        int highestRank = 0;
        String highestTier = null;
        String highestTierName = null;
        String customTier = null;
        String customName = null;
        boolean hasAny = false;
        if (packages != null) {
            for (MembershipPackage pkg : packages) {
                if (pkg == null) continue;
                hasAny = true;
                String normalizedTier = normalize(pkg.getMembershipTier());
                int rank = rank(normalizedTier);
                if (rank > highestRank) {
                    highestRank = rank;
                    highestTier = normalizedTier;
                    highestTierName = pkg.getName();
                } else if (customName == null && (normalizedTier != null || pkg.getPackageType() == PackageType.VIP)) {
                    customTier = normalizedTier != null ? normalizedTier : "VIP";
                    customName = pkg.getName() != null && !pkg.getName().isBlank() ? pkg.getName().trim() : "HỘI VIÊN VIP";
                }
            }
        }
        if (highestTier != null) {
            String label = highestTierName != null && !highestTierName.isBlank()
                    ? highestTierName
                    : fromString(highestTier).map(MembershipTier::getDisplayName).orElse(highestTier);
            return new TierDisplay(highestTier, label.toUpperCase(Locale.ROOT));
        }
        if (customName != null) {
            return new TierDisplay(customTier, customName.toUpperCase(Locale.ROOT));
        }
        if (hasAny) {
            return new TierDisplay("STANDARD", "HỘI VIÊN STANDARD");
        }
        return new TierDisplay(emptyTier, emptyBadge);
    }
}
