import { getDatabase } from "./connection";
import { v4 as uuid } from "uuid";

/**
 * Seeds the database with realistic demo data for App Store screenshots.
 * Creates two students, ~2 weeks of activities, books, milestones,
 * events, and rewards so every screen looks populated.
 *
 * Safe to call on a non-empty database — checks for existing students first.
 */
export async function seedDemoData(): Promise<void> {
  const db = await getDatabase();

  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM students",
  );
  if (existing && existing.count > 0) {
    throw new Error("Database already has students. Clear data first.");
  }

  const now = new Date();
  const today = formatDate(now);
  const studentIdLily = uuid();
  const studentIdMax = uuid();

  // --- Students ---
  await db.runAsync(
    "INSERT INTO students (id, name, date_of_birth, grade_level, color) VALUES (?, ?, ?, ?, ?)",
    studentIdLily,
    "Lily",
    "2019-03-15",
    "1st",
    "fuchsia",
  );
  await db.runAsync(
    "INSERT INTO students (id, name, date_of_birth, grade_level, color) VALUES (?, ?, ?, ?, ?)",
    studentIdMax,
    "Max",
    "2021-07-22",
    "pre-k",
    "teal",
  );

  // --- Activities: spread across the last 14 days ---
  const lilyActivities = [
    // Today
    {
      title: "Addition and subtraction worksheet",
      subject: "math",
      type: "worksheet",
      duration: 30,
      daysAgo: 0,
    },
    {
      title: "Read Charlotte's Web ch. 8-9",
      subject: "reading",
      type: "reading",
      duration: 25,
      daysAgo: 0,
    },
    {
      title: "Spelling words practice",
      subject: "writing",
      type: "writing",
      duration: 15,
      daysAgo: 0,
    },
    // Yesterday
    {
      title: "Plant growth observation journal",
      subject: "science",
      type: "hands_on",
      duration: 20,
      daysAgo: 1,
    },
    {
      title: "Math facts flash cards",
      subject: "math",
      type: "interactive",
      duration: 15,
      daysAgo: 1,
    },
    {
      title: "Read Charlotte's Web ch. 6-7",
      subject: "reading",
      type: "reading",
      duration: 30,
      daysAgo: 1,
    },
    // 2 days ago
    {
      title: "Wrote a letter to grandma",
      subject: "writing",
      type: "writing",
      duration: 25,
      daysAgo: 2,
    },
    {
      title: "World map continents coloring",
      subject: "social-studies",
      type: "worksheet",
      duration: 20,
      daysAgo: 2,
    },
    {
      title: "Bike riding and stretching",
      subject: "physical-ed",
      type: "hands_on",
      duration: 45,
      daysAgo: 2,
    },
    // 3 days ago
    {
      title: "Measurement with ruler activity",
      subject: "math",
      type: "hands_on",
      duration: 20,
      daysAgo: 3,
    },
    {
      title: "Read Charlotte's Web ch. 4-5",
      subject: "reading",
      type: "reading",
      duration: 25,
      daysAgo: 3,
    },
    {
      title: "Watercolor painting — birds",
      subject: "art-music",
      type: "hands_on",
      duration: 40,
      daysAgo: 3,
    },
    // 4 days ago
    {
      title: "Skip counting by 5s worksheet",
      subject: "math",
      type: "worksheet",
      duration: 20,
      daysAgo: 4,
    },
    {
      title: "Life cycle of a butterfly video",
      subject: "science",
      type: "video",
      duration: 15,
      daysAgo: 4,
    },
    {
      title: "Handwriting practice — cursive letters",
      subject: "writing",
      type: "writing",
      duration: 15,
      daysAgo: 4,
    },
    // 5 days ago
    {
      title: "Telling time to the half hour",
      subject: "math",
      type: "worksheet",
      duration: 25,
      daysAgo: 5,
    },
    {
      title: "Community helpers discussion",
      subject: "social-studies",
      type: "interactive",
      duration: 20,
      daysAgo: 5,
    },
    {
      title: "Read Magic Tree House #1",
      subject: "reading",
      type: "reading",
      duration: 30,
      daysAgo: 5,
    },
    // 6 days ago
    {
      title: "Money counting practice",
      subject: "math",
      type: "hands_on",
      duration: 20,
      daysAgo: 6,
    },
    {
      title: "Piano lesson — Twinkle Twinkle",
      subject: "art-music",
      type: "hands_on",
      duration: 30,
      daysAgo: 6,
    },
    {
      title: "Making a sandwich — life skills",
      subject: "life-skills",
      type: "hands_on",
      duration: 15,
      daysAgo: 6,
    },
    // 7+ days ago (last week)
    {
      title: "Place value blocks activity",
      subject: "math",
      type: "hands_on",
      duration: 25,
      daysAgo: 7,
    },
    {
      title: "Sight words flash cards",
      subject: "reading",
      type: "interactive",
      duration: 15,
      daysAgo: 7,
    },
    {
      title: "Swimming at the rec center",
      subject: "physical-ed",
      type: "hands_on",
      duration: 60,
      daysAgo: 8,
    },
    {
      title: "Read Charlotte's Web ch. 1-3",
      subject: "reading",
      type: "reading",
      duration: 30,
      daysAgo: 8,
    },
    {
      title: "Simple addition story problems",
      subject: "math",
      type: "worksheet",
      duration: 20,
      daysAgo: 9,
    },
    {
      title: "Weather chart journaling",
      subject: "science",
      type: "writing",
      duration: 15,
      daysAgo: 9,
    },
    {
      title: "Solar system video — planets",
      subject: "science",
      type: "video",
      duration: 20,
      daysAgo: 10,
    },
    {
      title: "Map of our neighborhood walk",
      subject: "social-studies",
      type: "hands_on",
      duration: 35,
      daysAgo: 10,
    },
    {
      title: "Subtraction worksheet",
      subject: "math",
      type: "worksheet",
      duration: 20,
      daysAgo: 11,
    },
    {
      title: "Rhyming words game",
      subject: "reading",
      type: "interactive",
      duration: 15,
      daysAgo: 12,
    },
  ];

  const maxActivities = [
    // Today
    {
      title: "Counting bears 1-20",
      subject: "math",
      type: "hands_on",
      duration: 15,
      daysAgo: 0,
    },
    {
      title: "Read Pete the Cat aloud",
      subject: "reading",
      type: "reading",
      duration: 15,
      daysAgo: 0,
    },
    // Yesterday
    {
      title: "Letter tracing A-E",
      subject: "writing",
      type: "writing",
      duration: 10,
      daysAgo: 1,
    },
    {
      title: "Color mixing with paint",
      subject: "art-music",
      type: "hands_on",
      duration: 25,
      daysAgo: 1,
    },
    // 2 days ago
    {
      title: "Shapes scavenger hunt",
      subject: "math",
      type: "hands_on",
      duration: 20,
      daysAgo: 2,
    },
    {
      title: "Read The Very Hungry Caterpillar",
      subject: "reading",
      type: "reading",
      duration: 10,
      daysAgo: 2,
    },
    // 3 days ago
    {
      title: "Playground and obstacle course",
      subject: "physical-ed",
      type: "hands_on",
      duration: 45,
      daysAgo: 3,
    },
    {
      title: "Sorting colors and sizes",
      subject: "math",
      type: "hands_on",
      duration: 15,
      daysAgo: 3,
    },
    // 4 days ago
    {
      title: "ABC song and letter recognition",
      subject: "reading",
      type: "interactive",
      duration: 15,
      daysAgo: 4,
    },
    {
      title: "Play dough letters",
      subject: "writing",
      type: "hands_on",
      duration: 20,
      daysAgo: 4,
    },
    // 5 days ago
    {
      title: "Counting to 10 with blocks",
      subject: "math",
      type: "hands_on",
      duration: 10,
      daysAgo: 5,
    },
    {
      title: "Nature walk leaf collection",
      subject: "science",
      type: "hands_on",
      duration: 30,
      daysAgo: 5,
    },
    // 6 days ago
    {
      title: "Finger painting animals",
      subject: "art-music",
      type: "hands_on",
      duration: 20,
      daysAgo: 6,
    },
    {
      title: "Read Brown Bear Brown Bear",
      subject: "reading",
      type: "reading",
      duration: 10,
      daysAgo: 6,
    },
    // Last week
    {
      title: "Pattern blocks — ABAB",
      subject: "math",
      type: "hands_on",
      duration: 15,
      daysAgo: 7,
    },
    {
      title: "Tying shoes practice",
      subject: "life-skills",
      type: "hands_on",
      duration: 10,
      daysAgo: 8,
    },
    {
      title: "Nursery rhyme sing-along",
      subject: "art-music",
      type: "interactive",
      duration: 15,
      daysAgo: 9,
    },
    {
      title: "Bug observation with magnifying glass",
      subject: "science",
      type: "hands_on",
      duration: 20,
      daysAgo: 10,
    },
  ];

  for (const a of lilyActivities) {
    const date = formatDate(daysAgo(now, a.daysAgo));
    await db.runAsync(
      `INSERT INTO activities (id, student_id, subject_id, activity_type, title, description, date_completed, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(),
      studentIdLily,
      a.subject,
      a.type,
      a.title,
      "",
      date,
      a.duration,
    );
  }

  for (const a of maxActivities) {
    const date = formatDate(daysAgo(now, a.daysAgo));
    await db.runAsync(
      `INSERT INTO activities (id, student_id, subject_id, activity_type, title, description, date_completed, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(),
      studentIdMax,
      a.subject,
      a.type,
      a.title,
      "",
      date,
      a.duration,
    );
  }

  // --- Books ---
  const bookCharlotte = uuid();
  const bookMagicTree = uuid();
  const bookPeteCat = uuid();
  const bookWimpy = uuid();
  const bookCaterpillar = uuid();
  const bookBrownBear = uuid();

  const books = [
    {
      id: bookCharlotte,
      title: "Charlotte's Web",
      author: "E.B. White",
      pages: 184,
      level: "Grade 2-4",
      genre: "Fiction",
    },
    {
      id: bookMagicTree,
      title: "Magic Tree House #1",
      author: "Mary Pope Osborne",
      pages: 68,
      level: "Grade 1-3",
      genre: "Fiction",
    },
    {
      id: bookPeteCat,
      title: "Pete the Cat: I Love My White Shoes",
      author: "James Dean",
      pages: 40,
      level: "Pre-K",
      genre: "Picture Book",
    },
    {
      id: bookWimpy,
      title: "Diary of a Wimpy Kid",
      author: "Jeff Kinney",
      pages: 217,
      level: "Grade 3-5",
      genre: "Fiction",
    },
    {
      id: bookCaterpillar,
      title: "The Very Hungry Caterpillar",
      author: "Eric Carle",
      pages: 26,
      level: "Pre-K",
      genre: "Picture Book",
    },
    {
      id: bookBrownBear,
      title: "Brown Bear, Brown Bear",
      author: "Bill Martin Jr.",
      pages: 28,
      level: "Pre-K",
      genre: "Picture Book",
    },
  ];

  for (const b of books) {
    await db.runAsync(
      "INSERT INTO books (id, title, author, total_pages, reading_level, genre) VALUES (?, ?, ?, ?, ?, ?)",
      b.id,
      b.title,
      b.author,
      b.pages,
      b.level,
      b.genre,
    );
  }

  // Student-book assignments
  const studentBooks = [
    {
      studentId: studentIdLily,
      bookId: bookCharlotte,
      status: "in_progress",
      currentPage: 112,
      started: daysAgo(now, 12),
    },
    {
      studentId: studentIdLily,
      bookId: bookMagicTree,
      status: "completed",
      currentPage: 68,
      started: daysAgo(now, 20),
      finished: daysAgo(now, 14),
    },
    {
      studentId: studentIdLily,
      bookId: bookWimpy,
      status: "not_started",
      currentPage: 0,
    },
    {
      studentId: studentIdMax,
      bookId: bookPeteCat,
      status: "completed",
      currentPage: 40,
      started: daysAgo(now, 18),
      finished: daysAgo(now, 15),
    },
    {
      studentId: studentIdMax,
      bookId: bookCaterpillar,
      status: "in_progress",
      currentPage: 16,
      started: daysAgo(now, 5),
    },
    {
      studentId: studentIdMax,
      bookId: bookBrownBear,
      status: "completed",
      currentPage: 28,
      started: daysAgo(now, 25),
      finished: daysAgo(now, 22),
    },
  ];

  for (const sb of studentBooks) {
    await db.runAsync(
      `INSERT INTO student_books (id, student_id, book_id, status, current_page, started_date, finished_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      uuid(),
      sb.studentId,
      sb.bookId,
      sb.status,
      sb.currentPage,
      sb.started ? formatDate(sb.started) : null,
      sb.finished ? formatDate(sb.finished) : null,
    );
  }

  // --- Milestones ---
  const milestones = [
    // Lily
    {
      studentId: studentIdLily,
      subject: "math",
      title: "Add and subtract within 20",
      desc: "Fluently solve addition and subtraction problems up to 20",
      category: "academic",
      status: "in_progress",
      stars: 3,
      target: daysFromNow(now, 30),
    },
    {
      studentId: studentIdLily,
      subject: "reading",
      title: "Read 10 chapter books",
      desc: "Complete 10 chapter books independently",
      category: "reading",
      status: "in_progress",
      stars: 5,
      target: daysFromNow(now, 90),
    },
    {
      studentId: studentIdLily,
      subject: "writing",
      title: "Write a full paragraph",
      desc: "Write a paragraph with topic sentence, details, and closing",
      category: "academic",
      status: "not_started",
      stars: 3,
      target: daysFromNow(now, 45),
    },
    {
      studentId: studentIdLily,
      subject: "science",
      title: "Complete plant experiment",
      desc: "Grow a bean plant and record daily observations for 3 weeks",
      category: "science",
      status: "in_progress",
      stars: 2,
      target: daysFromNow(now, 14),
    },
    {
      studentId: studentIdLily,
      subject: "reading",
      title: "Read 50 sight words",
      desc: "Recognize and read 50 high-frequency words",
      category: "reading",
      status: "completed",
      stars: 2,
      completed: daysAgo(now, 8),
    },
    {
      studentId: studentIdLily,
      subject: "art-music",
      title: "Learn Twinkle Twinkle on piano",
      desc: "Play Twinkle Twinkle Little Star from memory",
      category: "music",
      status: "completed",
      stars: 2,
      completed: daysAgo(now, 3),
    },
    // Max
    {
      studentId: studentIdMax,
      subject: "math",
      title: "Count to 20",
      desc: "Count from 1 to 20 forwards and backwards",
      category: "academic",
      status: "in_progress",
      stars: 2,
      target: daysFromNow(now, 21),
    },
    {
      studentId: studentIdMax,
      subject: "reading",
      title: "Recognize all letters",
      desc: "Identify all 26 uppercase and lowercase letters",
      category: "reading",
      status: "in_progress",
      stars: 3,
      target: daysFromNow(now, 60),
    },
    {
      studentId: studentIdMax,
      subject: "writing",
      title: "Write first name",
      desc: "Write first name with correct letter formation",
      category: "academic",
      status: "completed",
      stars: 2,
      completed: daysAgo(now, 10),
    },
    {
      studentId: studentIdMax,
      subject: "life-skills",
      title: "Tie shoes independently",
      desc: "Tie shoelaces without help",
      category: "life-skills",
      status: "not_started",
      stars: 1,
      target: daysFromNow(now, 30),
    },
  ];

  for (const m of milestones) {
    const milestoneId = uuid();
    await db.runAsync(
      `INSERT INTO milestones (id, student_id, subject_id, title, description, category, status, star_value, target_date, completed_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      milestoneId,
      m.studentId,
      m.subject,
      m.title,
      m.desc,
      m.category,
      m.status,
      m.stars,
      m.target ? formatDate(m.target) : null,
      m.completed ? formatDate(m.completed) : null,
    );

    // Create rewards for completed milestones
    if (m.status === "completed" && m.completed) {
      await db.runAsync(
        `INSERT INTO student_rewards (id, student_id, milestone_id, stars_awarded, awarded_date)
         VALUES (?, ?, ?, ?, ?)`,
        uuid(),
        m.studentId,
        milestoneId,
        m.stars,
        formatDate(m.completed),
      );
    }
  }

  // --- Events / Field Trips ---
  const events = [
    {
      title: "Natural History Museum",
      location: "Las Vegas Natural History Museum",
      desc: "Explore dinosaur exhibits and wildlife galleries",
      date: formatDate(daysAgo(now, 5)),
      status: "completed",
      category: "educational",
      studentIds: [studentIdLily, studentIdMax],
      subjectIds: ["science", "social-studies"],
      cost: 24.0,
      outcomes: "Learned about Nevada desert wildlife and prehistoric fossils",
      startTime: "10:00",
      endTime: "13:00",
    },
    {
      title: "Park Day with Homeschool Group",
      location: "Sunset Park",
      desc: "Weekly meetup with our homeschool co-op families",
      date: formatDate(daysAgo(now, 2)),
      status: "completed",
      category: "social",
      studentIds: [studentIdLily, studentIdMax],
      subjectIds: ["physical-ed", "life-skills"],
      cost: 0,
      outcomes: "Social time, playground games, group activities",
      startTime: "10:00",
      endTime: "12:00",
    },
    {
      title: "Co-op Art Class",
      location: "Henderson Community Center",
      desc: "Monthly collaborative art session with other homeschool families",
      date: formatDate(daysFromNow(now, 5)),
      status: "not_started",
      category: "coop",
      studentIds: [studentIdLily, studentIdMax],
      subjectIds: ["art-music"],
      cost: 15.0,
      outcomes: "",
      startTime: "14:00",
      endTime: "15:30",
    },
    {
      title: "Springs Preserve Nature Walk",
      location: "Springs Preserve, Las Vegas",
      desc: "Guided nature walk and desert garden tour",
      date: formatDate(daysFromNow(now, 12)),
      status: "not_started",
      category: "educational",
      studentIds: [studentIdLily, studentIdMax],
      subjectIds: ["science"],
      cost: 19.0,
      outcomes: "",
      startTime: "09:30",
      endTime: "12:00",
    },
  ];

  for (const e of events) {
    await db.runAsync(
      `INSERT INTO field_trips (id, title, location, description, date, status, event_category, student_ids, subject_ids, cost, learning_outcomes, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uuid(),
      e.title,
      e.location,
      e.desc,
      e.date,
      e.status,
      e.category,
      JSON.stringify(e.studentIds),
      JSON.stringify(e.subjectIds),
      e.cost,
      e.outcomes,
      e.startTime,
      e.endTime,
    );
  }

  // --- Family Goal ---
  await db.runAsync(
    `INSERT INTO family_goals (id, title, star_target, reward_description, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    uuid(),
    "Pizza Night Out",
    25,
    "Earn 25 stars and the whole family goes out for pizza!",
    formatDate(daysAgo(now, 14)),
    formatDate(daysFromNow(now, 30)),
  );
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(from: Date, n: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(from: Date, n: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
}
