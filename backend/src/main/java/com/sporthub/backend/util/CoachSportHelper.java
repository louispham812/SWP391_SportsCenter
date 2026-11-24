package com.sporthub.backend.util;

import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.SportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Shared validation and normalization helpers for Coach ↔ Sport assignments.
 */
public final class CoachSportHelper {

    private static final int MAX_SPECIALTY_LENGTH = 200;

    private CoachSportHelper() {
    }

    public static boolean teachesSportId(User coach, Long sportId) {
        if (coach == null || sportId == null || coach.getCoachedSports() == null) {
            return false;
        }
        return coach.getCoachedSports().stream()
                .filter(Objects::nonNull)
                .anyMatch(s -> Objects.equals(s.getSportId(), sportId));
    }

    public static boolean teachesSport(User coach, Sport sport) {
        if (coach == null || sport == null) {
            return false;
        }
        Set<Sport> assigned = coach.getCoachedSports();
        if (assigned != null && !assigned.isEmpty()) {
            if (sport.getSportId() != null) {
                return teachesSportId(coach, sport.getSportId());
            }
            return assigned.stream()
                    .filter(Objects::nonNull)
                    .anyMatch(s -> specialtyMatchesSport(s.getSportName(), sport.getSportName()));
        }
        return specialtyMatchesSport(coach.getSpecialty(), sport.getSportName());
    }

    public static boolean specialtyMatchesSport(String specialty, String sportName) {
        if (specialty == null || specialty.isBlank() || sportName == null || sportName.isBlank()) {
            return false;
        }
        String normalizedSport = sportName.trim().toLowerCase(Locale.ROOT);
        String[] segments = specialty.split("[,;·/|]+");
        for (String segment : segments) {
            String trimmed = segment.trim().toLowerCase(Locale.ROOT);
            if (trimmed.equals(normalizedSport) || containsWholePhrase(trimmed, normalizedSport)) {
                return true;
            }
        }
        return false;
    }

    private static boolean containsWholePhrase(String text, String phrase) {
        int from = 0;
        while ((from = text.indexOf(phrase, from)) >= 0) {
            boolean startOk = from == 0 || !Character.isLetterOrDigit(text.charAt(from - 1));
            int end = from + phrase.length();
            boolean endOk = end == text.length() || !Character.isLetterOrDigit(text.charAt(end));
            if (startOk && endOk) {
                return true;
            }
            from = end;
        }
        return false;
    }

    public static void requireCoachTeachesSport(User coach, Sport sport) {
        if (teachesSport(coach, sport)) {
            return;
        }
        String coachName = (coach != null && coach.getFullName() != null && !coach.getFullName().isBlank())
                ? coach.getFullName()
                : "đã chọn";
        String sportName = (sport != null && sport.getSportName() != null && !sport.getSportName().isBlank())
                ? sport.getSportName()
                : "này";
        String assignedLabel = null;
        if (coach != null && coach.getSpecialty() != null && !coach.getSpecialty().isBlank()) {
            assignedLabel = coach.getSpecialty().trim();
        } else if (coach != null && coach.getCoachedSports() != null && !coach.getCoachedSports().isEmpty()) {
            assignedLabel = coach.getCoachedSports().stream()
                    .filter(Objects::nonNull)
                    .map(Sport::getSportName)
                    .filter(n -> n != null && !n.isBlank())
                    .collect(Collectors.joining(", "));
        }
        if (assignedLabel == null || assignedLabel.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Huấn luyện viên " + coachName + " chưa được phân công chuyên môn bộ môn " + sportName + ".");
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Huấn luyện viên " + coachName + " (" + assignedLabel + ") không dạy bộ môn " + sportName + ".");
    }

    public static List<Long> resolveCoachSportIds(User coach, List<Sport> allSports) {
        if (coach == null || !"COACH".equalsIgnoreCase(coach.getRole())) {
            return List.of();
        }
        Set<Sport> assigned = coach.getCoachedSports();
        if (assigned != null && !assigned.isEmpty()) {
            List<Long> assignedIds = assigned.stream()
                    .filter(Objects::nonNull)
                    .map(Sport::getSportId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .sorted()
                    .toList();
            if (!assignedIds.isEmpty()) {
                return assignedIds;
            }
        }
        if (allSports == null || allSports.isEmpty()) {
            return List.of();
        }
        return allSports.stream()
                .filter(Objects::nonNull)
                .filter(sport -> specialtyMatchesSport(coach.getSpecialty(), sport.getSportName()))
                .map(Sport::getSportId)
                .filter(Objects::nonNull)
                .toList();
    }

    /** Synchronizes both {@code coach.coachedSports} (dbo.coach_sports) and {@code coach.specialty}. */
    public static void applyCoachSports(
            User coach,
            List<Long> sportIds,
            String rawSpecialty,
            SportRepository sportRepository,
            boolean requiredWhenSportsAvailable) {
        syncCoachSports(coach, sportIds, rawSpecialty, sportRepository, requiredWhenSportsAvailable);
    }

    /** Synchronizes both {@code coach.coachedSports} (dbo.coach_sports) and {@code coach.specialty}. */
    public static void syncCoachSports(
            User coach,
            List<Long> sportIds,
            String rawSpecialty,
            SportRepository sportRepository,
            boolean requiredWhenSportsAvailable) {
        if (coach == null) {
            return;
        }
        List<Long> cleanIds = sportIds == null
                ? List.of()
                : sportIds.stream().filter(Objects::nonNull).distinct().toList();

        if (!cleanIds.isEmpty()) {
            if (sportRepository == null) {
                coach.setSpecialty(rawSpecialty != null && !rawSpecialty.isBlank() ? rawSpecialty.trim() : null);
                coach.setCoachedSports(new LinkedHashSet<>());
                return;
            }
            Map<Long, Sport> foundById = new LinkedHashMap<>();
            for (Sport sport : sportRepository.findAllById(cleanIds)) {
                if (sport != null && sport.getSportId() != null) {
                    foundById.put(sport.getSportId(), sport);
                }
            }
            if (foundById.size() != cleanIds.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ môn đã chọn không tồn tại.");
            }
            List<Sport> selectedSports = cleanIds.stream()
                    .map(foundById::get)
                    .toList();
            String joined = selectedSports.stream()
                    .map(Sport::getSportName)
                    .filter(name -> name != null && !name.isBlank())
                    .collect(Collectors.joining(", "));
            if (joined.length() > MAX_SPECIALTY_LENGTH) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Danh sách chuyên môn vượt quá giới hạn 200 ký tự.");
            }
            coach.setSpecialty(joined);
            coach.setCoachedSports(new LinkedHashSet<>(selectedSports));
            return;
        }

        if (rawSpecialty != null && !rawSpecialty.isBlank()) {
            String trimmed = rawSpecialty.trim();
            if (trimmed.length() > MAX_SPECIALTY_LENGTH) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Chuyên môn vượt quá giới hạn 200 ký tự.");
            }
            Set<Sport> matchedSports = new LinkedHashSet<>();
            if (sportRepository != null) {
                List<Sport> allSports = sportRepository.findAllByOrderBySportIdAsc();
                if (!allSports.isEmpty()) {
                    allSports.stream()
                            .filter(sport -> specialtyMatchesSport(trimmed, sport.getSportName()))
                            .forEach(matchedSports::add);
                    if (matchedSports.isEmpty()) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Chuyên môn của Huấn luyện viên phải khớp với ít nhất một bộ môn trong hệ thống.");
                    }
                }
            }
            coach.setSpecialty(trimmed);
            coach.setCoachedSports(matchedSports);
            return;
        }

        if (requiredWhenSportsAvailable && sportRepository != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn ít nhất một bộ môn giảng dạy cho Huấn luyện viên.");
        }
        coach.setSpecialty(null);
        coach.setCoachedSports(new LinkedHashSet<>());
    }
}
