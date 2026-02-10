import type { ActivityType, Subject, Student } from "../types";

export interface ParsedActivity {
  title: string;
  subject?: string; // matched subject ID
  activityType?: ActivityType;
  durationMinutes?: number;
  studentNames?: string[]; // matched student names
}

// Duration patterns: "30min", "30 min", "30 minutes", "1hr", "1.5 hours", "1h30m"
const DURATION_PATTERNS = [
  /(\d+\.?\d*)\s*(?:hr|hour)s?\s*(?:(\d+)\s*(?:min|minute)s?)?/i,
  /(\d+)\s*h\s*(\d+)\s*m/i,
  /(\d+)\s*(?:min|minute)s?/i,
];

// Activity type keywords
const TYPE_KEYWORDS: Record<string, ActivityType> = {
  worksheet: "worksheet",
  workbook: "worksheet",
  sheet: "worksheet",
  page: "worksheet",
  pages: "worksheet",
  video: "video",
  watch: "video",
  watched: "video",
  movie: "video",
  youtube: "video",
  read: "reading",
  reading: "reading",
  book: "reading",
  story: "reading",
  write: "writing",
  writing: "writing",
  wrote: "writing",
  journal: "writing",
  essay: "writing",
  spelling: "writing",
  "hands on": "hands_on",
  "hands-on": "hands_on",
  craft: "hands_on",
  experiment: "hands_on",
  project: "hands_on",
  build: "hands_on",
  built: "hands_on",
  art: "hands_on",
  paint: "hands_on",
  draw: "hands_on",
  game: "interactive",
  played: "interactive",
  quiz: "interactive",
  test: "interactive",
  assessment: "interactive",
  exam: "interactive",
  app: "interactive",
  field: "interactive",
  trip: "interactive",
};

/**
 * Parse a natural language activity description into structured data.
 *
 * Examples:
 * - "Math worksheet ch5 30min" → { subject: "math", type: "worksheet", title: "ch5", duration: 30 }
 * - "Reading for 1 hour" → { type: "reading", duration: 60 }
 * - "Science experiment 45 min" → { subject: "science", type: "hands_on", title: "experiment", duration: 45 }
 */
export function parseActivityInput(
  input: string,
  subjects: Subject[],
  students: Student[],
): ParsedActivity {
  let remaining = input.trim();
  const result: ParsedActivity = { title: remaining };

  // 1. Extract duration
  for (const pattern of DURATION_PATTERNS) {
    const match = remaining.match(pattern);
    if (match) {
      if (pattern.source.includes("hr|hour")) {
        const hours = parseFloat(match[1]);
        const mins = match[2] ? parseInt(match[2]) : 0;
        result.durationMinutes = Math.round(hours * 60) + mins;
      } else if (pattern.source.includes("h\\s")) {
        result.durationMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
      } else {
        result.durationMinutes = parseInt(match[1]);
      }
      remaining = remaining.replace(match[0], "").trim();
    }
  }

  // 2. Match subject names (case-insensitive)
  const lowerRemaining = remaining.toLowerCase();
  for (const subject of subjects) {
    const subjectLower = subject.name.toLowerCase();
    // Check for subject name match
    if (lowerRemaining.includes(subjectLower)) {
      result.subject = subject.id;
      // Remove the matched subject from remaining text
      const idx = lowerRemaining.indexOf(subjectLower);
      remaining = (
        remaining.substring(0, idx) +
        remaining.substring(idx + subjectLower.length)
      ).trim();
      break;
    }
    // Also check subject ID (e.g., "math" matches Mathematics)
    if (lowerRemaining.includes(subject.id.toLowerCase())) {
      result.subject = subject.id;
      const idx = lowerRemaining.indexOf(subject.id.toLowerCase());
      remaining = (
        remaining.substring(0, idx) +
        remaining.substring(idx + subject.id.length)
      ).trim();
      break;
    }
  }

  // 3. Match student names
  const matchedStudents: string[] = [];
  const lowerRemaining2 = remaining.toLowerCase();
  for (const student of students) {
    const firstName = student.name.split(" ")[0].toLowerCase();
    if (lowerRemaining2.includes(firstName)) {
      matchedStudents.push(student.name);
      const idx = lowerRemaining2.indexOf(firstName);
      remaining = (
        remaining.substring(0, idx) +
        remaining.substring(idx + firstName.length)
      ).trim();
    }
  }
  if (matchedStudents.length > 0) {
    result.studentNames = matchedStudents;
  }

  // 4. Match activity type from keywords
  const words = remaining.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (TYPE_KEYWORDS[word]) {
      result.activityType = TYPE_KEYWORDS[word];
      break;
    }
  }
  // Also check multi-word keywords
  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (keyword.includes(" ") && remaining.toLowerCase().includes(keyword)) {
      result.activityType = type;
      break;
    }
  }

  // 5. Clean up title - remove matched keywords and extra whitespace
  remaining = remaining
    .replace(/\s+/g, " ")
    .replace(/^[\s,·-]+|[\s,·-]+$/g, "")
    .trim();

  if (remaining) {
    result.title = remaining;
  } else {
    // Generate a title from what we know
    const parts: string[] = [];
    if (result.activityType) {
      const typeLabels: Record<ActivityType, string> = {
        worksheet: "Worksheet",
        video: "Video",
        reading: "Reading",
        writing: "Writing",
        hands_on: "Hands-on activity",
        interactive: "Interactive activity",
      };
      parts.push(typeLabels[result.activityType]);
    }
    result.title = parts.join(" ") || input.trim();
  }

  return result;
}
