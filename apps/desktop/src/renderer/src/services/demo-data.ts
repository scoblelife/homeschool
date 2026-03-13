/**
 * Demo seed data for live demos.
 *
 * Populates the database with realistic sample data for two students
 * (Pre-K and 1st Grade) covering ~3 weeks of homeschool activities.
 *
 * Usage: call `seedDemoData()` from the browser console or dev menu:
 *   import('/src/services/demo-data').then(m => m.seedDemoData())
 *
 * Or use the Settings page "Load Demo Data" button (if wired up).
 */

import type {
  CreateStudent,
  CreateSession,
  CreateActivity,
  CreateFieldTrip,
  CreateBook,
  Subject,
  Student,
  Milestone,
} from "../../../shared/types";

const api = window.api;

// Helper: format date as YYYY-MM-DD
function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Helper: date N days ago from today
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

// Helper: time string HH:MM
function timeStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Helper: pick a random item from an array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Subject lookup by name
async function getSubjectMap(): Promise<Record<string, string>> {
  const subjects = await api.getSubjects();
  const map: Record<string, string> = {};
  for (const s of subjects) {
    map[s.name] = s.id;
  }
  return map;
}

export async function seedDemoData(): Promise<{
  students: Student[];
  activitiesCreated: number;
}> {
  console.log("[Demo Data] Starting demo data seed...");

  // Check if demo students already exist
  const existingStudents = await api.getStudents();
  if (existingStudents.some((s) => s.name === "Emma" || s.name === "Liam")) {
    console.warn("[Demo Data] Demo students already exist. Skipping seed.");
    return { students: existingStudents, activitiesCreated: 0 };
  }

  // Get subject IDs
  const subjectMap = await getSubjectMap();
  const mathId = subjectMap["Math"];
  const readingId = subjectMap["Reading"];
  const writingId = subjectMap["Writing"];
  const scienceId = subjectMap["Science"];
  const socialStudiesId = subjectMap["Social Studies"];
  const lifeSkillsId = subjectMap["Life Skills"];
  const peId = subjectMap["Physical Education"];
  const artId = subjectMap["Art & Music"];

  if (!mathId || !readingId) {
    throw new Error(
      "[Demo Data] Default subjects not found. Run the app first to seed subjects.",
    );
  }

  // --- Create Students ---
  const emma = await api.createStudent({
    name: "Emma",
    dateOfBirth: "2020-08-15",
    gradeLevel: "pre-k",
    color: "child1",
  } as CreateStudent);
  console.log("[Demo Data] Created student: Emma (Pre-K)");

  const liam = await api.createStudent({
    name: "Liam",
    dateOfBirth: "2019-03-22",
    gradeLevel: "1st",
    color: "child2",
  } as CreateStudent);
  console.log("[Demo Data] Created student: Liam (1st Grade)");

  // --- Initialize Milestones ---
  await api.initializeStudentMilestones(emma.id, "pre-k");
  await api.initializeStudentMilestones(liam.id, "1st");
  console.log("[Demo Data] Initialized milestones for both students");

  // --- Mark some milestones as completed ---
  const emmaMilestones = await api.getMilestones(emma.id);
  const liamMilestones = await api.getMilestones(liam.id);

  // Complete ~15% of Emma's milestones and ~20% of Liam's
  const emmaToComplete = emmaMilestones
    .filter((m) => m.status === "not_started")
    .slice(0, Math.floor(emmaMilestones.length * 0.15));
  const emmaInProgress = emmaMilestones
    .filter((m) => m.status === "not_started" && !emmaToComplete.includes(m))
    .slice(0, 5);

  for (const m of emmaToComplete) {
    await api.updateMilestone(m.id, {
      status: "completed",
      completedDate: daysAgo(Math.floor(Math.random() * 14) + 1),
      evidenceNotes: "Demonstrated during daily activities",
    });
  }
  for (const m of emmaInProgress) {
    await api.updateMilestone(m.id, { status: "in_progress" });
  }

  const liamToComplete = liamMilestones
    .filter((m) => m.status === "not_started")
    .slice(0, Math.floor(liamMilestones.length * 0.2));
  const liamInProgress = liamMilestones
    .filter((m) => m.status === "not_started" && !liamToComplete.includes(m))
    .slice(0, 8);

  for (const m of liamToComplete) {
    await api.updateMilestone(m.id, {
      status: "completed",
      completedDate: daysAgo(Math.floor(Math.random() * 14) + 1),
      evidenceNotes: "Completed worksheet and oral assessment",
    });
  }
  for (const m of liamInProgress) {
    await api.updateMilestone(m.id, { status: "in_progress" });
  }
  console.log(
    `[Demo Data] Updated milestones: Emma ${emmaToComplete.length} completed, ${emmaInProgress.length} in progress; Liam ${liamToComplete.length} completed, ${liamInProgress.length} in progress`,
  );

  // --- Activity templates by subject and student ---
  interface ActivityTemplate {
    subjectId: string;
    title: string;
    description: string;
    activityType: CreateActivity["activityType"];
    activitySubType?: string;
    durationMinutes: number;
    bookTitle?: string;
    pagesRead?: number;
    totalPages?: number;
  }

  const emmaActivities: ActivityTemplate[] = [
    {
      subjectId: mathId,
      title: "Counting to 20",
      description: "Practiced counting objects up to 20",
      activityType: "hands_on",
      durationMinutes: 20,
    },
    {
      subjectId: mathId,
      title: "Shape sorting",
      description: "Sorted wooden blocks by shape and color",
      activityType: "hands_on",
      durationMinutes: 15,
    },
    {
      subjectId: mathId,
      title: "Number tracing worksheet",
      description: "Traced numbers 1-10 on worksheet",
      activityType: "worksheet",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Letter recognition flashcards",
      description: "Reviewed uppercase and lowercase letters A-M",
      activityType: "interactive",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Read aloud: Chicka Chicka Boom Boom",
      description: "Read together and identified letters in the story",
      activityType: "reading",
      durationMinutes: 20,
      bookTitle: "Chicka Chicka Boom Boom",
      pagesRead: 36,
      totalPages: 36,
    },
    {
      subjectId: readingId,
      title: "Phonics: letter sounds A-F",
      description: "Practiced beginning sounds with picture cards",
      activityType: "interactive",
      durationMinutes: 15,
    },
    {
      subjectId: writingId,
      title: "Name writing practice",
      description: "Practiced writing first name with proper letter formation",
      activityType: "writing",
      activitySubType: "print",
      durationMinutes: 10,
    },
    {
      subjectId: writingId,
      title: "Letter tracing: A-E",
      description: "Traced uppercase and lowercase letters",
      activityType: "writing",
      activitySubType: "print",
      durationMinutes: 15,
    },
    {
      subjectId: scienceId,
      title: "Nature walk observation",
      description: "Walked in the neighborhood, identified 5 different plants",
      activityType: "hands_on",
      durationMinutes: 30,
    },
    {
      subjectId: scienceId,
      title: "Weather chart",
      description:
        "Updated daily weather chart with temperature and conditions",
      activityType: "hands_on",
      durationMinutes: 10,
    },
    {
      subjectId: artId,
      title: "Watercolor painting",
      description: "Painted a picture of our family using watercolors",
      activityType: "hands_on",
      durationMinutes: 25,
    },
    {
      subjectId: peId,
      title: "Playground time",
      description: "Climbing, swinging, balance beam at the park",
      activityType: "hands_on",
      durationMinutes: 45,
    },
    {
      subjectId: lifeSkillsId,
      title: "Helped with lunch prep",
      description: "Washed vegetables and helped set the table",
      activityType: "hands_on",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Storytime: The Very Hungry Caterpillar",
      description: "Read together, talked about days of the week and counting",
      activityType: "reading",
      durationMinutes: 15,
      bookTitle: "The Very Hungry Caterpillar",
      pagesRead: 26,
      totalPages: 26,
    },
    {
      subjectId: mathId,
      title: "Pattern blocks",
      description: "Created patterns with colored blocks: ABAB and AABB",
      activityType: "hands_on",
      durationMinutes: 20,
    },
  ];

  const liamActivities: ActivityTemplate[] = [
    {
      subjectId: mathId,
      title: "Addition facts to 10",
      description: "Practiced single-digit addition with manipulatives",
      activityType: "worksheet",
      durationMinutes: 25,
    },
    {
      subjectId: mathId,
      title: "Place value: tens and ones",
      description: "Used base-10 blocks to understand place value",
      activityType: "hands_on",
      durationMinutes: 20,
    },
    {
      subjectId: mathId,
      title: "Subtraction within 10",
      description: "Solved subtraction problems using counters",
      activityType: "worksheet",
      durationMinutes: 20,
    },
    {
      subjectId: mathId,
      title: "Math facts video: addition songs",
      description: "Watched addition song videos for memorization",
      activityType: "video",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Sight words practice (set 3)",
      description: "Reviewed and practiced 10 new sight words",
      activityType: "interactive",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Read: Frog and Toad Are Friends",
      description: "Read chapter 1-2 independently with discussion",
      activityType: "reading",
      durationMinutes: 25,
      bookTitle: "Frog and Toad Are Friends",
      pagesRead: 20,
      totalPages: 64,
    },
    {
      subjectId: readingId,
      title: "Phonics: blends (bl, cl, fl)",
      description: "Practiced consonant blends with word lists",
      activityType: "worksheet",
      durationMinutes: 15,
    },
    {
      subjectId: writingId,
      title: "Journal entry: My weekend",
      description: "Wrote 3 sentences about weekend activities",
      activityType: "writing",
      activitySubType: "print",
      durationMinutes: 20,
    },
    {
      subjectId: writingId,
      title: "Handwriting practice: lowercase letters",
      description: "Practiced forming lowercase g, j, p, q, y",
      activityType: "writing",
      activitySubType: "print",
      durationMinutes: 15,
    },
    {
      subjectId: scienceId,
      title: "Plant growth experiment",
      description: "Measured bean sprout growth, recorded in science journal",
      activityType: "hands_on",
      durationMinutes: 20,
    },
    {
      subjectId: scienceId,
      title: "Life cycles video",
      description: "Watched butterfly life cycle documentary",
      activityType: "video",
      durationMinutes: 20,
    },
    {
      subjectId: socialStudiesId,
      title: "Map skills: our neighborhood",
      description: "Drew a simple map of our street and nearby landmarks",
      activityType: "hands_on",
      durationMinutes: 25,
    },
    {
      subjectId: socialStudiesId,
      title: "Community helpers discussion",
      description: "Read about community helpers and discussed their roles",
      activityType: "reading",
      durationMinutes: 15,
    },
    {
      subjectId: artId,
      title: "Drawing: self portrait",
      description: "Drew a detailed self-portrait with colored pencils",
      activityType: "hands_on",
      durationMinutes: 30,
    },
    {
      subjectId: peId,
      title: "Soccer practice",
      description: "Dribbling and passing practice in the backyard",
      activityType: "hands_on",
      durationMinutes: 30,
    },
    {
      subjectId: lifeSkillsId,
      title: "Money counting",
      description: "Practiced identifying and counting coins",
      activityType: "hands_on",
      durationMinutes: 15,
    },
    {
      subjectId: readingId,
      title: "Read: Frog and Toad (chapters 3-4)",
      description: "Continued reading with comprehension questions",
      activityType: "reading",
      durationMinutes: 25,
      bookTitle: "Frog and Toad Are Friends",
      pagesRead: 22,
      totalPages: 64,
    },
    {
      subjectId: mathId,
      title: "Telling time: hour and half hour",
      description: "Used practice clock to read times to the half hour",
      activityType: "hands_on",
      durationMinutes: 15,
    },
  ];

  // --- Create sessions and activities for the last 3 weeks ---
  // Only create activities on weekdays
  let activitiesCreated = 0;
  const today = new Date();

  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateString = dateStr(date);

    // Each day: 2-4 activities per student
    const emmaCount = 2 + Math.floor(Math.random() * 3); // 2-4
    const liamCount = 3 + Math.floor(Math.random() * 2); // 3-4

    // Emma's day
    const emmaSession = await api.createSession({
      studentId: emma.id,
      subjectId: mathId, // primary subject
      date: dateString,
      startTime: timeStr(9, 0),
      endTime: timeStr(9 + emmaCount, 0),
      notes: "",
    } as CreateSession);

    for (let i = 0; i < emmaCount; i++) {
      const template =
        emmaActivities[(dayOffset * 3 + i) % emmaActivities.length];
      await api.createActivity({
        sessionId: emmaSession.id,
        studentId: emma.id,
        subjectId: template.subjectId,
        activityType: template.activityType,
        activitySubType: template.activitySubType,
        title: template.title,
        description: template.description,
        dateCompleted: dateString,
        durationMinutes: template.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: "",
        bookTitle: template.bookTitle,
        pagesRead: template.pagesRead,
        totalPages: template.totalPages,
      } as CreateActivity);
      activitiesCreated++;
    }

    // Liam's day
    const liamSession = await api.createSession({
      studentId: liam.id,
      subjectId: mathId,
      date: dateString,
      startTime: timeStr(9, 0),
      endTime: timeStr(9 + liamCount, 0),
      notes: "",
    } as CreateSession);

    for (let i = 0; i < liamCount; i++) {
      const template =
        liamActivities[(dayOffset * 3 + i) % liamActivities.length];
      await api.createActivity({
        sessionId: liamSession.id,
        studentId: liam.id,
        subjectId: template.subjectId,
        activityType: template.activityType,
        activitySubType: template.activitySubType,
        title: template.title,
        description: template.description,
        dateCompleted: dateString,
        durationMinutes: template.durationMinutes,
        grade: null,
        maxGrade: null,
        notes: "",
        bookTitle: template.bookTitle,
        pagesRead: template.pagesRead,
        totalPages: template.totalPages,
      } as CreateActivity);
      activitiesCreated++;
    }
  }

  console.log(
    `[Demo Data] Created ${activitiesCreated} activities over 3 weeks`,
  );

  // --- Create Books ---
  const books = [
    {
      title: "Chicka Chicka Boom Boom",
      author: "Bill Martin Jr.",
      totalPages: 36,
      genre: "Picture Book",
    },
    {
      title: "The Very Hungry Caterpillar",
      author: "Eric Carle",
      totalPages: 26,
      genre: "Picture Book",
    },
    {
      title: "Frog and Toad Are Friends",
      author: "Arnold Lobel",
      totalPages: 64,
      genre: "Early Reader",
    },
    {
      title: "Brown Bear, Brown Bear, What Do You See?",
      author: "Bill Martin Jr.",
      totalPages: 28,
      genre: "Picture Book",
    },
    {
      title: "Magic Tree House: Dinosaurs Before Dark",
      author: "Mary Pope Osborne",
      totalPages: 68,
      genre: "Chapter Book",
    },
  ];

  for (const bookData of books) {
    const book = await api.createBook(bookData as CreateBook);

    // Assign reading progress
    if (bookData.title === "Chicka Chicka Boom Boom") {
      await api.updateStudentBook(emma.id, book.id, {
        status: "completed",
        currentPage: 36,
        startedDate: daysAgo(14),
        finishedDate: daysAgo(10),
        rating: 5,
      });
    } else if (bookData.title === "The Very Hungry Caterpillar") {
      await api.updateStudentBook(emma.id, book.id, {
        status: "completed",
        currentPage: 26,
        startedDate: daysAgo(7),
        finishedDate: daysAgo(5),
        rating: 5,
      });
    } else if (bookData.title === "Brown Bear, Brown Bear, What Do You See?") {
      await api.updateStudentBook(emma.id, book.id, {
        status: "in_progress",
        currentPage: 12,
        startedDate: daysAgo(2),
      });
    } else if (bookData.title === "Frog and Toad Are Friends") {
      await api.updateStudentBook(liam.id, book.id, {
        status: "in_progress",
        currentPage: 42,
        startedDate: daysAgo(10),
      });
    } else if (bookData.title === "Magic Tree House: Dinosaurs Before Dark") {
      await api.updateStudentBook(liam.id, book.id, {
        status: "not_started",
        currentPage: 0,
      });
    }
  }
  console.log(
    `[Demo Data] Created ${books.length} books with reading progress`,
  );

  // --- Create Field Trips ---
  const fieldTrips: CreateFieldTrip[] = [
    {
      title: "Discovery Children's Museum",
      activityType: "interactive",
      eventCategory: "educational",
      location: "Discovery Children's Museum, Las Vegas",
      description:
        "Hands-on science and art exhibits. Focus on water table and building zone.",
      date: daysAgo(8),
      startTime: "10:00",
      endTime: "13:00",
      status: "completed",
      studentIds: [emma.id, liam.id],
      subjectIds: [scienceId, artId].filter(Boolean) as string[],
      notes:
        "Both kids loved the water exhibit. Liam spent extra time in the building zone.",
      learningOutcomes:
        "Explored water flow, building structures, and art creation",
    },
    {
      title: "Springs Preserve Nature Walk",
      activityType: "interactive",
      eventCategory: "educational",
      location: "Springs Preserve, Las Vegas",
      description: "Nature trail walk with plant and animal identification.",
      date: daysAgo(3),
      startTime: "09:00",
      endTime: "11:30",
      status: "completed",
      studentIds: [emma.id, liam.id],
      subjectIds: [scienceId].filter(Boolean) as string[],
      notes: "Identified 8 different desert plants. Saw a roadrunner!",
      learningOutcomes: "Desert ecosystem, plant adaptation, animal habitats",
    },
    {
      title: "Library Story Time & Book Fair",
      activityType: "interactive",
      eventCategory: "social",
      location: "Henderson Libraries - Green Valley",
      description: "Weekly story time followed by the spring book fair.",
      date: dateStr(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
      startTime: "10:30",
      endTime: "12:00",
      status: "not_started",
      studentIds: [emma.id, liam.id],
      subjectIds: [readingId].filter(Boolean) as string[],
      notes: "Remember to bring library cards",
    },
    {
      title: "Homeschool Co-op Science Day",
      activityType: "interactive",
      eventCategory: "coop",
      location: "Sunset Park Pavilion",
      description:
        "Monthly co-op meeting. This month: volcano experiments and nature journals.",
      date: dateStr(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)), // 12 days from now
      startTime: "10:00",
      endTime: "13:00",
      status: "not_started",
      studentIds: [emma.id, liam.id],
      subjectIds: [scienceId, socialStudiesId].filter(Boolean) as string[],
    },
  ];

  for (const ft of fieldTrips) {
    await api.createFieldTrip(ft);
  }
  console.log(`[Demo Data] Created ${fieldTrips.length} field trips`);

  // --- Summary ---
  console.log("[Demo Data] Demo data seeding complete!");
  console.log(`  Students: Emma (Pre-K), Liam (1st Grade)`);
  console.log(`  Activities: ${activitiesCreated}`);
  console.log(`  Books: ${books.length}`);
  console.log(`  Field Trips: ${fieldTrips.length}`);

  return { students: [emma, liam], activitiesCreated };
}

/**
 * Remove all demo data (students named Emma and Liam and their associated data).
 */
export async function clearDemoData(): Promise<void> {
  console.log("[Demo Data] Clearing demo data...");

  const students = await api.getStudents();
  const demoStudents = students.filter(
    (s) => s.name === "Emma" || s.name === "Liam",
  );

  for (const student of demoStudents) {
    // Delete activities
    const activities = await api.getActivities({ studentId: student.id });
    for (const a of activities) {
      await api.deleteActivity(a.id);
    }

    // Delete sessions
    const sessions = await api.getSessions({ studentId: student.id });
    for (const s of sessions) {
      await api.deleteSession(s.id);
    }

    // Delete milestones
    const milestones = await api.getMilestones(student.id);
    for (const m of milestones) {
      await api.deleteMilestone(m.id);
    }

    // Delete student
    await api.deleteStudent(student.id);
    console.log(
      `[Demo Data] Deleted student: ${student.name} and all associated data`,
    );
  }

  // Delete field trips that have no students left
  const fieldTrips = await api.getFieldTrips();
  for (const ft of fieldTrips) {
    if (
      ft.studentIds.every((id) => demoStudents.some((s) => s.id === id)) ||
      ft.studentIds.length === 0
    ) {
      await api.deleteFieldTrip(ft.id);
    }
  }

  console.log("[Demo Data] Demo data cleared.");
}
