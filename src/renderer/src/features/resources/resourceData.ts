import type { GradeLevel, ActivityType } from "../../../../shared/types";

export interface LearningResource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: "video" | "practice" | "reading" | "game" | "tool" | "reference";
  subjects: string[];
  gradeLevels: GradeLevel[];
  isFree: boolean;
  isSponsored?: boolean; // True if this resource has a sponsorship partnership
  suggestedActivityType: ActivityType;
  suggestedDuration: number; // in minutes
  icon: string; // emoji
  features: string[];
}

// Popular educational resources
export const LEARNING_RESOURCES: LearningResource[] = [
  // VIDEO LEARNING
  {
    id: "khan-academy",
    name: "Khan Academy",
    description:
      "Free video lessons and practice exercises covering math, science, history, and more.",
    url: "https://www.khanacademy.org/",
    category: "video",
    subjects: ["math", "science", "reading", "history", "art"],
    gradeLevels: [
      "pre-k",
      "k",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: true,
    isSponsored: true,
    suggestedActivityType: "video",
    suggestedDuration: 30,
    icon: "🎓",
    features: [
      "Video lessons",
      "Practice exercises",
      "Progress tracking",
      "Parent dashboard",
    ],
  },
  {
    id: "khan-academy-kids",
    name: "Khan Academy Kids",
    description:
      "Free, fun educational app for children ages 2-8 with thousands of activities.",
    url: "https://learn.khanacademy.org/khan-academy-kids/",
    category: "game",
    subjects: ["reading", "math", "social-emotional"],
    gradeLevels: ["pre-k", "k", "1st", "2nd"],
    isFree: true,
    suggestedActivityType: "interactive",
    suggestedDuration: 20,
    icon: "🧒",
    features: [
      "Interactive activities",
      "Read-along books",
      "Math games",
      "Social-emotional learning",
    ],
  },
  {
    id: "brainpop",
    name: "BrainPOP",
    description: "Animated educational videos and quizzes on various subjects.",
    url: "https://www.brainpop.com/",
    category: "video",
    subjects: [
      "science",
      "math",
      "english",
      "social-studies",
      "health",
      "art",
      "technology",
    ],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    isFree: false,
    suggestedActivityType: "video",
    suggestedDuration: 15,
    icon: "🎬",
    features: [
      "Animated videos",
      "Quizzes",
      "Vocabulary",
      "Creative activities",
    ],
  },
  {
    id: "brainpop-jr",
    name: "BrainPOP Jr.",
    description: "Educational videos and activities designed for K-3 learners.",
    url: "https://jr.brainpop.com/",
    category: "video",
    subjects: ["science", "math", "reading", "social-studies", "health"],
    gradeLevels: ["k", "1st", "2nd", "3rd"],
    isFree: false,
    suggestedActivityType: "video",
    suggestedDuration: 10,
    icon: "🎥",
    features: [
      "Age-appropriate content",
      "Annie and Moby characters",
      "Games",
      "Activities",
    ],
  },
  {
    id: "crash-course-kids",
    name: "Crash Course Kids",
    description:
      "YouTube science videos for elementary students from the Crash Course team.",
    url: "https://www.youtube.com/c/CrashCourseKids",
    category: "video",
    subjects: ["science"],
    gradeLevels: ["3rd", "4th", "5th"],
    isFree: true,
    suggestedActivityType: "video",
    suggestedDuration: 10,
    icon: "🔬",
    features: [
      "YouTube channel",
      "Earth science",
      "Life science",
      "Physical science",
    ],
  },

  // READING RESOURCES
  {
    id: "starfall",
    name: "Starfall",
    description:
      "Free reading program for early learners with phonics activities.",
    url: "https://www.starfall.com/",
    category: "reading",
    subjects: ["reading"],
    gradeLevels: ["pre-k", "k", "1st", "2nd"],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 20,
    icon: "⭐",
    features: [
      "Phonics",
      "Read-along books",
      "Songs",
      "Interactive activities",
    ],
  },
  {
    id: "epic",
    name: "Epic!",
    description: "Digital library with 40,000+ books for kids 12 and under.",
    url: "https://www.getepic.com/",
    category: "reading",
    subjects: ["reading"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th", "5th", "6th"],
    isFree: false,
    suggestedActivityType: "reading",
    suggestedDuration: 30,
    icon: "📚",
    features: ["Digital library", "Read-to-me", "Quizzes", "Reading badges"],
  },
  {
    id: "storyline-online",
    name: "Storyline Online",
    description:
      "Free read-aloud videos featuring celebrities reading children's books.",
    url: "https://storylineonline.net/",
    category: "reading",
    subjects: ["reading"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd"],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 15,
    icon: "🎭",
    features: ["Celebrity readers", "Activity guides", "High-quality books"],
  },
  {
    id: "librivox",
    name: "LibriVox",
    description: "Free public domain audiobooks read by volunteers.",
    url: "https://librivox.org/",
    category: "reading",
    subjects: ["reading", "history"],
    gradeLevels: [
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 30,
    icon: "🎧",
    features: ["Audiobooks", "Classic literature", "Free", "Public domain"],
  },

  // MATH PRACTICE
  {
    id: "ixl",
    name: "IXL",
    description:
      "Personalized math and language arts practice with comprehensive reporting.",
    url: "https://www.ixl.com/",
    category: "practice",
    subjects: ["math", "language-arts"],
    gradeLevels: [
      "pre-k",
      "k",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: false,
    suggestedActivityType: "worksheet",
    suggestedDuration: 20,
    icon: "📈",
    features: [
      "Adaptive practice",
      "Detailed analytics",
      "Standards-aligned",
      "Awards",
    ],
  },
  {
    id: "prodigy",
    name: "Prodigy Math",
    description:
      "Free math game where kids practice math to cast spells and battle monsters.",
    url: "https://www.prodigygame.com/",
    category: "game",
    subjects: ["math"],
    gradeLevels: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    isFree: true,
    suggestedActivityType: "interactive",
    suggestedDuration: 30,
    icon: "🧙",
    features: [
      "RPG-style game",
      "Adaptive questions",
      "Parent dashboard",
      "Standards-aligned",
    ],
  },
  {
    id: "zearn",
    name: "Zearn",
    description:
      "Free math curriculum with digital lessons and independent practice.",
    url: "https://www.zearn.org/",
    category: "practice",
    subjects: ["math"],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th", "5th"],
    isFree: true,
    suggestedActivityType: "video",
    suggestedDuration: 30,
    icon: "🔢",
    features: [
      "Video lessons",
      "Digital problems",
      "Manipulatives",
      "Progress tracking",
    ],
  },
  {
    id: "coolmath",
    name: "Coolmath Games",
    description: "Math games and logic puzzles that make learning fun.",
    url: "https://www.coolmathgames.com/",
    category: "game",
    subjects: ["math"],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    isFree: true,
    suggestedActivityType: "interactive",
    suggestedDuration: 20,
    icon: "🎮",
    features: ["Logic games", "Strategy games", "Fun math practice"],
  },
  {
    id: "math-playground",
    name: "Math Playground",
    description: "Math games, logic puzzles, and educational activities.",
    url: "https://www.mathplayground.com/",
    category: "game",
    subjects: ["math"],
    gradeLevels: ["1st", "2nd", "3rd", "4th", "5th", "6th"],
    isFree: true,
    suggestedActivityType: "interactive",
    suggestedDuration: 20,
    icon: "🎯",
    features: ["Math games", "Word problems", "Logic games", "Thinking blocks"],
  },

  // SCIENCE RESOURCES
  {
    id: "national-geographic-kids",
    name: "National Geographic Kids",
    description:
      "Science videos, articles, games, and activities about animals and nature.",
    url: "https://kids.nationalgeographic.com/",
    category: "reference",
    subjects: ["science", "geography"],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th", "5th", "6th"],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 20,
    icon: "🌍",
    features: ["Animal facts", "Games", "Videos", "Amazing photos"],
  },
  {
    id: "phet",
    name: "PhET Simulations",
    description:
      "Free interactive math and science simulations from University of Colorado.",
    url: "https://phet.colorado.edu/",
    category: "tool",
    subjects: ["science", "math"],
    gradeLevels: [
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 25,
    icon: "🔭",
    features: [
      "Physics simulations",
      "Chemistry simulations",
      "Math simulations",
      "Research-based",
    ],
  },
  {
    id: "nasa-kids",
    name: "NASA Kids' Club",
    description: "Games, activities, and information about space from NASA.",
    url: "https://www.nasa.gov/stem/forstudents/k-4/index.html",
    category: "reference",
    subjects: ["science"],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th"],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 20,
    icon: "🚀",
    features: ["Space facts", "Games", "Videos", "STEM activities"],
  },

  // TYPING AND TECHNOLOGY
  {
    id: "typing-club",
    name: "TypingClub",
    description: "Free typing curriculum with lessons and games.",
    url: "https://www.typingclub.com/",
    category: "practice",
    subjects: ["technology"],
    gradeLevels: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 15,
    icon: "⌨️",
    features: ["Typing lessons", "Games", "Progress tracking", "Certificates"],
  },
  {
    id: "scratch",
    name: "Scratch",
    description:
      "Free coding platform from MIT for kids to create stories, games, and animations.",
    url: "https://scratch.mit.edu/",
    category: "tool",
    subjects: ["technology", "art"],
    gradeLevels: ["2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 30,
    icon: "🐱",
    features: ["Block coding", "Create games", "Share projects", "Community"],
  },
  {
    id: "code-org",
    name: "Code.org",
    description: "Free coding courses and activities for all ages.",
    url: "https://code.org/",
    category: "practice",
    subjects: ["technology"],
    gradeLevels: [
      "k",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 30,
    icon: "💻",
    features: [
      "Hour of Code",
      "CS courses",
      "Progress tracking",
      "Certificates",
    ],
  },

  // ART & MUSIC
  {
    id: "art-for-kids-hub",
    name: "Art for Kids Hub",
    description:
      "YouTube channel with step-by-step drawing tutorials for kids.",
    url: "https://www.youtube.com/c/ArtforKidsHub",
    category: "video",
    subjects: ["art"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th", "5th", "6th"],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 30,
    icon: "🎨",
    features: ["Drawing tutorials", "Family-friendly", "Various skill levels"],
  },
  {
    id: "chrome-music-lab",
    name: "Chrome Music Lab",
    description:
      "Fun experiments to learn about music through interactive play.",
    url: "https://musiclab.chromeexperiments.com/",
    category: "tool",
    subjects: ["music"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th", "5th", "6th"],
    isFree: true,
    suggestedActivityType: "hands_on",
    suggestedDuration: 15,
    icon: "🎵",
    features: [
      "Sound experiments",
      "Rhythm tools",
      "Melody makers",
      "Visual music",
    ],
  },

  // FOREIGN LANGUAGE
  {
    id: "duolingo",
    name: "Duolingo",
    description: "Free language learning app with gamified lessons.",
    url: "https://www.duolingo.com/",
    category: "practice",
    subjects: ["foreign-language"],
    gradeLevels: [
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th",
      "10th",
      "11th",
      "12th",
    ],
    isFree: true,
    suggestedActivityType: "reading",
    suggestedDuration: 15,
    icon: "🦉",
    features: [
      "Many languages",
      "Gamified",
      "Bite-sized lessons",
      "Progress tracking",
    ],
  },
];

// Helper functions
export function getResourcesBySubject(subject: string): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.subjects.includes(subject));
}

export function getResourcesByGrade(grade: GradeLevel): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.gradeLevels.includes(grade));
}

export function getResourcesByCategory(
  category: LearningResource["category"],
): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.category === category);
}

export function getFreeResources(): LearningResource[] {
  return LEARNING_RESOURCES.filter((r) => r.isFree);
}

export function searchResources(query: string): LearningResource[] {
  const lower = query.toLowerCase();
  return LEARNING_RESOURCES.filter(
    (r) =>
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.features.some((f) => f.toLowerCase().includes(lower)),
  );
}

export function getResourceById(id: string): LearningResource | undefined {
  return LEARNING_RESOURCES.find((r) => r.id === id);
}

export function getUniqueSubjects(): string[] {
  const subjects = new Set<string>();
  LEARNING_RESOURCES.forEach((r) => r.subjects.forEach((s) => subjects.add(s)));
  return Array.from(subjects).sort();
}

export function getUniqueCategories(): LearningResource["category"][] {
  const categories = new Set<LearningResource["category"]>();
  LEARNING_RESOURCES.forEach((r) => categories.add(r.category));
  return Array.from(categories);
}
