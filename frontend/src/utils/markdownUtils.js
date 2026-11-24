/**
 * Utility functions for cleaning and normalizing Markdown text.
 */

const METADATA_LINE_RE = /^(?:đối\s*tượng|hồ\s*sơ|chỉ\s*số|tên\s*lớp|lớp\s*học|lớp\s*đã\s*đăng\s*ký|thời\s*gian|ngày\s*(?:học|tập)|học\s*viên|họ\s*tên(?:\s*\/\s*cấp\s*độ)?|cấp\s*độ|huấn\s*luyện\s*viên|hlv|trình\s*độ|thể\s*trạng|sĩ\s*số|địa\s*điểm|phòng\s*tập|bộ\s*môn|chủ\s*đề|tổng\s*quan|giới\s*thiệu|mục\s*đích|lưu\s*ý\s*y\s*tế|thông\s*tin\s*hội\s*viên)(?=$|[:\s-])/i;
const SECTION_PREFIX_RE = /^(?:phần\s*\d+|giai\s*đoạn\s*\d+|bước\s*\d+|[IVX]+\.)\s*[:\-–.]?\s*/i;
const EXERCISE_BLOCK_HEADER_RE = /^(?:bài(?:\s*tập)?|exercise)\s*\d+\s*[:\-–.]\s*(.+)$/i;
const NON_EXERCISE_LINE_RE = /^(?:đối\s*tượng|hồ\s*sơ|chỉ\s*số|tên\s*lớp|lớp\s*học|lớp\s*đã\s*đăng\s*ký|thời\s*gian|ngày\s*(?:học|tập)|học\s*viên|họ\s*tên(?:\s*\/\s*cấp\s*độ)?|cấp\s*độ|huấn\s*luyện\s*viên|hlv|trình\s*độ|thể\s*trạng|sĩ\s*số|địa\s*điểm|phòng\s*tập|bộ\s*môn|chủ\s*đề|tổng\s*quan|giới\s*thiệu|mục\s*đích|lưu\s*ý\s*y\s*tế|thông\s*tin\s*hội\s*viên|giáo\s*án|phần\s*\d+|giai\s*đoạn\s*\d*|khởi\s*động|hồi\s*phục|giãn\s*cơ|dặn\s*dò|lưu\s*ý|mục\s*tiêu|ghi\s*chú|nhận\s*xét|dinh\s*dưỡng|warmup|cool[\s-]?down|homework)(?=$|[:\s(-])/i;

function extractWorkingWeightKg(text) {
  if (!text) return 0;
  // Ignore 1RM goal targets ("nâng 1RM Squat lên 125kg") and small progression notes ("tăng 2.5kg")
  const sanitized = text
    .replace(/\b1\s*rm\b[^.;()\n]*?\d+(?:[.,]\d+)?\s*kg\b/gi, '')
    .replace(/(?:tăng|giảm)(?:\s+nhẹ)?\s+\d+(?:[.,]\d+)?\s*kg\b/gi, '');
  const m = sanitized.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*kg(?=$|[\s/,;.)])/i);
  const val = m ? Number(m[1].replace(',', '.')) : 0;
  return Number.isFinite(val) && val >= 0 ? val : 0;
}

function parseSetsAndReps(text) {
  const srMatch = text.match(
    /(\d+)\s*(?:hiệp|sets?|vòng|lượt)?\s*[x×*]\s*(\d+)(?:\s*(?:đến|tới|[-–])\s*\d+)?\s*(?:reps?|lần|nhịp|bước|s|giây|phút)?/i
  );
  if (srMatch) {
    return {
      sets: Number(srMatch[1]),
      reps: Number(srMatch[2]),
    };
  }
  const setsMatch = text.match(/(\d+)\s*(?:hiệp|sets?|vòng|lượt)/i);
  // Do NOT include 's' or 'giây' here so rest durations like "4 hiệp, nghỉ 60s" never become 60 reps
  const repsMatch = text.match(/(\d+)\s*(?:reps?|lần(?:\s*lặp)?|nhịp|bước)/i);
  if (!setsMatch && !repsMatch) return null;
  return {
    sets: setsMatch ? Number(setsMatch[1]) : 3,
    reps: repsMatch ? Number(repsMatch[1]) : 10,
  };
}

function parseExerciseBlock(titleRaw, detailLines) {
  const titleSr = parseSetsAndReps(titleRaw);
  let sets = titleSr?.sets ?? 3;
  let reps = titleSr?.reps ?? 10;
  let foundMainSetsReps = Boolean(titleSr);
  let weightKg = extractWorkingWeightKg(titleRaw);

  let name = titleRaw
    .replace(/\s*\([^)]*\)\s*:\s*$/g, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/:\s*$/g, '')
    .replace(/\((?:[^)]*(?:mục\s*tiêu|bổ\s*trợ|hiệp|sets?|reps?|lần|kg|x|×)[^)]*)\)/gi, '')
    .replace(/\s*[-–]\s*\d+\s*(?:hiệp|sets?|x|×).*$/i, '')
    .replace(/\s+[-–]\s+.*$/, '')
    .trim();
  if (!name || name.length < 2) {
    name = titleRaw.replace(/:\s*$/g, '').trim();
  }

  const noteParts = [];

  for (const rawLine of detailLines) {
    const cleanLine = rawLine.replace(/^(?:\d+[.)]|[-•+])\s+/, '').trim();
    if (!cleanLine) continue;
    const isWarmupSetLine = /^khởi\s*động/i.test(cleanLine);
    const isPrimarySetsLine = /^(?:cấu\s*trúc|số\s*hiệp|thời\s*lượng|hiệp\s*chính|sets?)/i.test(cleanLine);

    const parsedSr = parseSetsAndReps(cleanLine);
    if (parsedSr && (!foundMainSetsReps || isPrimarySetsLine) && !isWarmupSetLine) {
      sets = parsedSr.sets;
      reps = parsedSr.reps;
      if (isPrimarySetsLine || !isWarmupSetLine) {
        foundMainSetsReps = true;
      }
    }

    if (weightKg === 0 && !isWarmupSetLine) {
      const w = extractWorkingWeightKg(cleanLine);
      if (w > 0) weightKg = w;
    }

    if (/^(?:lưu\s*ý|thực\s*hiện|mức\s*tạ|mức\s*độ\s*tăng\s*tiến|nghỉ|nhịp)/i.test(cleanLine)) {
      noteParts.push(cleanLine.replace(/^(?:lưu\s*ý\s*(?:an\s*toàn)?|thực\s*hiện)\s*:\s*/i, ''));
    }
  }

  return {
    name: name.slice(0, 100),
    sets: Number.isFinite(sets) && sets > 0 ? sets : 3,
    reps: Number.isFinite(reps) && reps > 0 ? reps : 10,
    weightKg,
    note: noteParts.join(' • ').slice(0, 180),
  };
}

function parseExerciseLine(line) {
  const cleaned = line.replace(/^(?:\d+[.)]|[-•])\s+/, '').trim();
  if (!cleaned || cleaned.length > 160 || NON_EXERCISE_LINE_RE.test(cleaned)) {
    return null;
  }

  const colonIdx = cleaned.indexOf(':');
  const head = colonIdx > 0 ? cleaned.slice(0, colonIdx).trim() : cleaned;
  const tail = colonIdx > 0 ? cleaned.slice(colonIdx + 1).trim() : cleaned;
  if ((colonIdx > 0 && !tail) || NON_EXERCISE_LINE_RE.test(head)) {
    return null;
  }

  const parsedSr = parseSetsAndReps(cleaned);
  const weightKg = extractWorkingWeightKg(cleaned);
  if (!parsedSr && weightKg === 0 && colonIdx < 0) {
    return null;
  }

  const sets = parsedSr?.sets ?? 3;
  const reps = parsedSr?.reps ?? 10;

  let name = head
    .replace(/\((?:[^)]*(?:hiệp|sets?|reps?|lần|kg|x|×)[^)]*)\)/gi, '')
    .replace(/[-–]\s*\d+\s*(?:hiệp|sets?|x|×).*$/i, '')
    .trim();
  if (!name || name.length < 2) {
    name = head.slice(0, 80).trim();
  }

  let note = '';
  if (colonIdx > 0 && tail) {
    note = tail
      .replace(/^\d+\s*(?:hiệp|sets?|vòng|lượt)?\s*[x×*]\s*\d+(?:\s*[-–]\s*\d+)?\s*(?:reps?|lần|nhịp|s|giây|phút)?\s*/i, '')
      .replace(/^\(?\d+(?:[.,]\d+)?\s*kg\)?[,;.\s-]*/i, '')
      .replace(/^[-–,;\s]+/, '')
      .trim();
  }

  return {
    name: name.slice(0, 100),
    sets: Number.isFinite(sets) && sets > 0 ? sets : 3,
    reps: Number.isFinite(reps) && reps > 0 ? reps : 10,
    weightKg,
    note: note.slice(0, 180),
  };
}

function cleanMarkdownText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s*(.+)$/gm, '$1')
    .replace(/^([-*]{3,}|_{3,})$/gm, '')
    .replace(/\*\*\*([^*]+?)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/___([^_]+?)___/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    .replace(/(^|\s)\*([^*\s][^*]*?)\*($|\s)/g, '$1$2$3')
    .replace(/(^|\s)_([^_\s][^_]*?)_($|\s)/g, '$1$2$3')
    .replace(/`([^`]+?)`/g, '$1')
    .replace(/^(\s*)[*+]\s+/gm, '$1- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseAiWorkoutPlan(rawText, fallback = {}) {
  const cleaned = cleanMarkdownText(rawText);
  if (!cleaned) {
    return null;
  }

  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = {
    goal: [],
    warmup: [],
    main: [],
    cooldown: [],
    homework: [],
  };
  let activeSection = 'intro';
  let hasExplicitMainSection = false;

  for (const line of lines) {
    const isBullet = /^[-•]\s+/.test(line);
    const isNumberedWithInlineBody = /^\d+[.)]\s+[^:]+:\s*\S+/.test(line);
    const unprefixed = line.replace(/^(?:\d+[.)]|[-•])\s+/, '').replace(SECTION_PREFIX_RE, '').trim();
    const headerCandidate = unprefixed.replace(/\([^)]*\)/g, '').trim();
    const lowerHeader = headerCandidate.toLowerCase();

    if (METADATA_LINE_RE.test(unprefixed.toLowerCase())) {
      continue;
    }

    if (!isBullet && !isNumberedWithInlineBody && /^(?:mục\s*tiêu|goal)(?=$|[\s:(–-])/i.test(lowerHeader)) {
      activeSection = 'goal';
      const rest = unprefixed.replace(/^[^:]+:\s*/, '');
      if (rest && rest !== unprefixed) sections.goal.push(rest);
      continue;
    }
    if (!isBullet && !isNumberedWithInlineBody && /^(?:khởi\s*động|làm\s*nóng|warm[\s-]?up)(?=$|[\s:(–-])/i.test(lowerHeader)) {
      activeSection = 'warmup';
      const rest = unprefixed.replace(/^[^:]+:\s*/, '');
      if (rest && rest !== unprefixed && !/^(?:với|và|cơ|nhẹ)/i.test(rest)) sections.warmup.push(rest);
      continue;
    }
    if (!isBullet && !isNumberedWithInlineBody && /^(?:bài\s*tập\s*chính|nội\s*dung(?:\s*tập)?\s*chính|phần\s*chính|lộ\s*trình(?:\s*tập)?|chương\s*trình\s*tập|main(?:\s*workout)?)(?=$|[\s:(–-])/i.test(lowerHeader)) {
      activeSection = 'main';
      hasExplicitMainSection = true;
      continue;
    }
    if (
      !isBullet &&
      !isNumberedWithInlineBody &&
      (
        /^(?:hồi\s*phục|thả\s*lỏng|giãn\s*cơ|cool[\s-]?down|nhận\s*xét(?:\s+chung)?)(?=$|[\s:(–-])/i.test(lowerHeader) ||
        (activeSection !== 'main' && /^lưu\s*ý\s*an\s*toàn(?:\s+chung)?(?=$|[\s:(–-])/i.test(lowerHeader))
      )
    ) {
      activeSection = 'cooldown';
      const rest = unprefixed.replace(/^[^:]+:\s*/, '');
      if (rest && rest !== unprefixed && !/^(?:tĩnh|nhẹ|và)/i.test(rest)) sections.cooldown.push(rest);
      continue;
    }
    if (!isBullet && !isNumberedWithInlineBody && /^(?:dặn\s*dò|bài\s*tập\s*về\s*nhà|dinh\s*dưỡng|lời\s*khuyên|homework)(?=$|[\s:(–-])/i.test(lowerHeader)) {
      activeSection = 'homework';
      const rest = unprefixed.replace(/^[^:]+:\s*/, '');
      if (rest && rest !== unprefixed) sections.homework.push(rest);
      continue;
    }

    if (SECTION_PREFIX_RE.test(line)) {
      continue;
    }

    if (activeSection !== 'intro') {
      sections[activeSection].push(line);
    } else if (/^(?:\d+[.)]|[-•+])\s+/.test(line) && EXERCISE_BLOCK_HEADER_RE.test(unprefixed)) {
      activeSection = 'main';
      sections.main.push(line);
    }
  }

  const candidateLines = sections.main.length > 0 ? sections.main : (hasExplicitMainSection ? [] : lines);
  const exercises = [];

  // First try grouping structured "Bài N: <Name>" blocks
  let currentBlockTitle = null;
  let currentBlockDetails = [];
  const flushBlock = () => {
    if (currentBlockTitle) {
      exercises.push(parseExerciseBlock(currentBlockTitle, currentBlockDetails));
      currentBlockTitle = null;
      currentBlockDetails = [];
    }
  };

  for (const line of candidateLines) {
    const stripped = line.replace(/^(?:\d+[.)]|[-•+])\s+/, '').trim();
    const blockMatch = stripped.match(EXERCISE_BLOCK_HEADER_RE);
    if (blockMatch) {
      flushBlock();
      currentBlockTitle = blockMatch[1].trim();
      if (exercises.length >= 8) break;
    } else if (currentBlockTitle) {
      currentBlockDetails.push(line);
    }
  }
  flushBlock();

  // Next, inside an explicit main section that uses numbered blocks ("1. Squat:\n - Cấu trúc: 5x5")
  const hasBulletChildLines = candidateLines.some((l) => /^[-•+]\s+/.test(l));
  if (exercises.length === 0 && hasExplicitMainSection && hasBulletChildLines) {
    for (const line of candidateLines) {
      const numMatch = line.match(/^\d+[.)]\s+(.+)$/);
      if (numMatch) {
        flushBlock();
        currentBlockTitle = numMatch[1].trim();
        if (exercises.length >= 8) break;
      } else if (currentBlockTitle) {
        currentBlockDetails.push(line);
      }
    }
    flushBlock();
  }

  // Otherwise parse compact single-line exercises inside main section
  if (exercises.length === 0) {
    for (const line of candidateLines) {
      const parsed = parseExerciseLine(line);
      if (parsed) {
        exercises.push(parsed);
        if (exercises.length >= 8) break;
      }
    }
  }

  if (exercises.length === 0) {
    for (const line of candidateLines) {
      if (/^(?:\d+[.)]|[-•])\s+/.test(line)) {
        const cleanedBullet = line.replace(/^(?:\d+[.)]|[-•])\s+/, '').trim();
        if (NON_EXERCISE_LINE_RE.test(cleanedBullet)) continue;
        const name = cleanedBullet.split(':')[0].trim();
        if (name && name.length >= 3 && name.length <= 90) {
          exercises.push({ name, sets: 3, reps: 10, weightKg: 0, note: '' });
          if (exercises.length >= 5) break;
        }
      }
    }
  }

  const filterSignoff = (arr) => arr.filter((l) => !/^chúc\s+(?:hlv|bạn|học\s*viên)\b/i.test(l));
  const homeworkLines = filterSignoff(sections.homework);
  const cooldownLines = filterSignoff(sections.cooldown);

  const goalText = sections.goal.join(' ').trim() || fallback.goal || '';
  const warmupSummary = sections.warmup.slice(0, 2).join('; ');
  const cooldownSummary = cooldownLines.join(' ').trim();
  const homeworkText = homeworkLines.join(' ').trim();

  return {
    goal: goalText.slice(0, 300),
    exercises: exercises.slice(0, 8),
    sessionResult: warmupSummary ? `Khởi động: ${warmupSummary}`.slice(0, 350) : fallback.sessionResult || '',
    coachFeedback: (cooldownSummary || cleaned.slice(0, 350)).slice(0, 450),
    homework: (homeworkText || cooldownLines.slice(-1)[0] || fallback.homework || '').slice(0, 350),
  };
}
