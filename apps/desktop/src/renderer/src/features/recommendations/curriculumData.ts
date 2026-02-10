import type { GradeLevel } from "../../../../shared/types";

export interface CurriculumRecommendation {
  id: string;
  name: string;
  publisher: string;
  description: string;
  subjects: string[];
  gradeLevels: GradeLevel[];
  websiteUrl: string;
  priceRange: "free" | "budget" | "mid" | "premium";
  style:
    | "traditional"
    | "charlotte_mason"
    | "classical"
    | "montessori"
    | "unschooling"
    | "unit_study"
    | "online";
  features: string[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  category: "complete" | "subject" | "supplement";
}

// Popular homeschool curricula recommendations
export const CURRICULUM_RECOMMENDATIONS: CurriculumRecommendation[] = [
  // COMPLETE CURRICULUM PACKAGES
  {
    id: "sonlight",
    name: "Sonlight",
    publisher: "Sonlight Curriculum",
    description:
      "Literature-based Christian curriculum with read-aloud books and discussion guides. Known for excellent book selections.",
    subjects: ["reading", "history", "science", "bible", "language-arts"],
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
    websiteUrl: "https://www.sonlight.com/",
    priceRange: "premium",
    style: "charlotte_mason",
    features: [
      "Complete curriculum packages",
      "Instructor guides",
      "Living books approach",
      "Flexible scheduling",
    ],
    pros: [
      "High-quality literature selections",
      "Thorough instructor guides",
      "Strong reading focus",
    ],
    cons: [
      "Higher price point",
      "Requires significant parent involvement",
      "Christian content throughout",
    ],
    bestFor: [
      "Book lovers",
      "Families wanting turnkey curriculum",
      "Literature-based learning",
    ],
    category: "complete",
  },
  {
    id: "abeka",
    name: "Abeka",
    publisher: "Pensacola Christian College",
    description:
      "Traditional textbook-based Christian curriculum with structured daily lesson plans.",
    subjects: [
      "math",
      "reading",
      "language-arts",
      "science",
      "history",
      "bible",
    ],
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
    websiteUrl: "https://www.abeka.com/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "Complete curriculum",
      "Video lessons available",
      "Accredited program option",
      "Detailed teacher guides",
    ],
    pros: [
      "Well-organized",
      "Traditional structure",
      "Video instruction available",
    ],
    cons: ["Fast-paced", "Some find it rigid", "Heavily Christian"],
    bestFor: [
      "Families wanting structure",
      "Traditional schooling approach",
      "Video-assisted teaching",
    ],
    category: "complete",
  },
  {
    id: "oak-meadow",
    name: "Oak Meadow",
    publisher: "Oak Meadow",
    description:
      "Waldorf-inspired curriculum emphasizing creativity, nature, and hands-on learning.",
    subjects: [
      "math",
      "reading",
      "language-arts",
      "science",
      "social-studies",
      "art",
    ],
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
    websiteUrl: "https://www.oakmeadow.com/",
    priceRange: "mid",
    style: "montessori",
    features: [
      "Waldorf-inspired",
      "Seasonal learning",
      "Art integration",
      "Accredited option",
    ],
    pros: ["Gentle approach", "Creative projects", "Nature-based"],
    cons: ["Less structured", "May need supplementation in math/science"],
    bestFor: [
      "Creative learners",
      "Nature-loving families",
      "Waldorf approach",
    ],
    category: "complete",
  },
  {
    id: "time4learning",
    name: "Time4Learning",
    publisher: "Time4Learning",
    description:
      "Online curriculum with interactive lessons, automatic grading, and progress tracking.",
    subjects: ["math", "language-arts", "science", "social-studies"],
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
    websiteUrl: "https://www.time4learning.com/",
    priceRange: "budget",
    style: "online",
    features: [
      "Online platform",
      "Auto-grading",
      "Progress reports",
      "Flexible schedule",
    ],
    pros: ["Self-paced", "Low parent involvement", "Affordable"],
    cons: ["Screen-based", "Limited hands-on", "Some repetitive content"],
    bestFor: [
      "Working parents",
      "Independent learners",
      "Tech-comfortable families",
    ],
    category: "complete",
  },

  // MATH CURRICULA
  {
    id: "math-u-see",
    name: "Math-U-See",
    publisher: "Math-U-See",
    description:
      "Mastery-based math curriculum using manipulatives and video instruction.",
    subjects: ["math"],
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
    websiteUrl: "https://www.mathusee.com/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "Manipulative-based",
      "Video lessons",
      "Mastery approach",
      "Systematic build",
    ],
    pros: [
      "Strong conceptual foundation",
      "Great for visual learners",
      "Clear progression",
    ],
    cons: ["Slower pace for some", "Manipulatives required"],
    bestFor: [
      "Visual learners",
      "Math-struggling students",
      "Hands-on approach",
    ],
    category: "subject",
  },
  {
    id: "singapore-math",
    name: "Singapore Math",
    publisher: "Singapore Math Inc.",
    description:
      "Problem-solving focused math from Singapore, known for building deep understanding.",
    subjects: ["math"],
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
    ],
    websiteUrl: "https://www.singaporemath.com/",
    priceRange: "budget",
    style: "traditional",
    features: [
      "Bar modeling",
      "Mental math",
      "Word problems",
      "Conceptual approach",
    ],
    pros: [
      "Excellent problem-solving skills",
      "Deep understanding",
      "Internationally recognized",
    ],
    cons: [
      "Can be challenging",
      "Requires parent familiarity",
      "Different methods than US schools",
    ],
    bestFor: [
      "Math-inclined students",
      "Strong problem solvers",
      "Asian math approach",
    ],
    category: "subject",
  },
  {
    id: "right-start-math",
    name: "RightStart Math",
    publisher: "RightStart Mathematics",
    description:
      "Hands-on math using an abacus and games for conceptual understanding.",
    subjects: ["math"],
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
    ],
    websiteUrl: "https://www.rightstartmath.com/",
    priceRange: "mid",
    style: "traditional",
    features: ["Abacus-based", "Games included", "Lesson scripts", "Hands-on"],
    pros: ["Builds number sense", "Fun games", "Strong conceptual foundation"],
    cons: ["Teacher-intensive", "Materials to manage", "Can be pricey"],
    bestFor: [
      "Kinesthetic learners",
      "Building number sense",
      "Game-based learning",
    ],
    category: "subject",
  },
  {
    id: "beast-academy",
    name: "Beast Academy",
    publisher: "Art of Problem Solving",
    description:
      "Comic-style math curriculum for advanced elementary students.",
    subjects: ["math"],
    gradeLevels: ["1st", "2nd", "3rd", "4th", "5th"],
    websiteUrl: "https://beastacademy.com/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "Comic format",
      "Challenging problems",
      "Online puzzles",
      "Critical thinking",
    ],
    pros: ["Engaging format", "Develops problem-solving", "Fun characters"],
    cons: [
      "Can be challenging",
      "Not for struggling students",
      "Above grade level",
    ],
    bestFor: ["Gifted math students", "Challenge seekers", "Comic lovers"],
    category: "subject",
  },
  {
    id: "khan-academy",
    name: "Khan Academy",
    publisher: "Khan Academy",
    description:
      "Free online learning platform with video lessons and practice exercises.",
    subjects: ["math", "science", "reading", "history"],
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
    websiteUrl: "https://www.khanacademy.org/",
    priceRange: "free",
    style: "online",
    features: [
      "Video lessons",
      "Practice exercises",
      "Progress tracking",
      "Personalized learning",
    ],
    pros: ["Completely free", "Self-paced", "Comprehensive content"],
    cons: ["Screen-based", "Limited hands-on", "Can feel impersonal"],
    bestFor: [
      "Budget-conscious families",
      "Independent learners",
      "Supplementing other curriculum",
    ],
    category: "supplement",
  },

  // READING/LANGUAGE ARTS
  {
    id: "all-about-reading",
    name: "All About Reading",
    publisher: "All About Learning Press",
    description:
      "Orton-Gillingham based reading program with multisensory activities.",
    subjects: ["reading"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th"],
    websiteUrl: "https://www.allaboutlearningpress.com/all-about-reading/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "Multisensory",
      "Scripted lessons",
      "Phonics-based",
      "Fluency focus",
    ],
    pros: [
      "Excellent for struggling readers",
      "Complete program",
      "Well-organized",
    ],
    cons: ["Teacher-intensive", "Materials required", "Pricey"],
    bestFor: ["Beginning readers", "Struggling readers", "Dyslexia-friendly"],
    category: "subject",
  },
  {
    id: "explode-the-code",
    name: "Explode the Code",
    publisher: "School Specialty",
    description:
      "Phonics workbook series for building reading and spelling skills.",
    subjects: ["reading", "language-arts"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd"],
    websiteUrl:
      "https://eps.schoolspecialty.com/products/literacy/phonics-word-study/explode-the-code",
    priceRange: "budget",
    style: "traditional",
    features: [
      "Workbook format",
      "Sequential phonics",
      "Independent work",
      "Affordable",
    ],
    pros: ["Easy to use", "Independent practice", "Budget-friendly"],
    cons: ["Repetitive", "Worksheet heavy", "Limited engagement"],
    bestFor: ["Phonics practice", "Independent work", "Supplemental reading"],
    category: "supplement",
  },
  {
    id: "logic-of-english",
    name: "Logic of English",
    publisher: "Logic of English",
    description: "Comprehensive phonogram-based reading and spelling program.",
    subjects: ["reading", "language-arts", "writing"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th"],
    websiteUrl: "https://www.logicofenglish.com/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "74 phonograms",
      "Spelling rules",
      "Handwriting",
      "Complete program",
    ],
    pros: ["Thorough approach", "Explains exceptions", "Includes handwriting"],
    cons: ["Complex for teacher", "Learning curve", "Time-intensive"],
    bestFor: [
      "Understanding English rules",
      "Spelling strugglers",
      "Complete language arts",
    ],
    category: "subject",
  },

  // SCIENCE
  {
    id: "real-science-4-kids",
    name: "Real Science 4 Kids",
    publisher: "Gravitas Publications",
    description:
      "Hands-on science curriculum that introduces real science concepts early.",
    subjects: ["science"],
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
    ],
    websiteUrl: "https://www.gravitaspublications.com/",
    priceRange: "mid",
    style: "traditional",
    features: [
      "Experiment-based",
      "Real science terms",
      "Secular",
      "Colorful books",
    ],
    pros: ["Engaging experiments", "Accurate science", "Secular option"],
    cons: ["Materials needed", "Short lessons", "May need supplementing"],
    bestFor: [
      "Hands-on science",
      "Early chemistry/physics",
      "Secular families",
    ],
    category: "subject",
  },
  {
    id: "mystery-science",
    name: "Mystery Science",
    publisher: "Mystery Science",
    description: "Video-based science lessons with hands-on activities.",
    subjects: ["science"],
    gradeLevels: ["k", "1st", "2nd", "3rd", "4th", "5th"],
    websiteUrl: "https://mysteryscience.com/",
    priceRange: "budget",
    style: "online",
    features: [
      "Video lessons",
      "Simple materials",
      "Discussion questions",
      "NGSS aligned",
    ],
    pros: ["Engaging videos", "Easy to implement", "Affordable"],
    cons: ["Screen-based", "Limited depth", "Subscription required"],
    bestFor: ["Busy parents", "Video learners", "Easy science implementation"],
    category: "subject",
  },

  // HISTORY/SOCIAL STUDIES
  {
    id: "story-of-the-world",
    name: "Story of the World",
    publisher: "Well-Trained Mind Press",
    description:
      "Four-year history curriculum telling world history as a story.",
    subjects: ["history", "social-studies"],
    gradeLevels: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    websiteUrl: "https://welltrainedmind.com/a/story-of-the-world/",
    priceRange: "budget",
    style: "classical",
    features: [
      "Narrative approach",
      "Activity guides",
      "Maps and coloring",
      "Audio available",
    ],
    pros: [
      "Engaging stories",
      "Comprehensive coverage",
      "Great activity books",
    ],
    cons: ["Requires activity book for hands-on", "Western-centric"],
    bestFor: ["History lovers", "Classical education", "Read-aloud families"],
    category: "subject",
  },

  // WRITING
  {
    id: "handwriting-without-tears",
    name: "Handwriting Without Tears",
    publisher: "Learning Without Tears",
    description:
      "Developmentally appropriate handwriting program using multisensory techniques.",
    subjects: ["writing"],
    gradeLevels: ["pre-k", "k", "1st", "2nd", "3rd", "4th", "5th"],
    websiteUrl: "https://www.lwtears.com/",
    priceRange: "budget",
    style: "traditional",
    features: [
      "Multisensory",
      "Wood pieces",
      "Simple letter forms",
      "Consistent method",
    ],
    pros: ["Easy to teach", "Reduces frustration", "Multisensory approach"],
    cons: ["Materials needed", "Different letter forms", "Some find it slow"],
    bestFor: [
      "Young writers",
      "Struggling with handwriting",
      "Fine motor development",
    ],
    category: "subject",
  },
  {
    id: "brave-writer",
    name: "Brave Writer",
    publisher: "Brave Writer",
    description:
      "Writing curriculum focused on the writing lifestyle and natural learning.",
    subjects: ["writing", "language-arts"],
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
    websiteUrl: "https://bravewriter.com/",
    priceRange: "mid",
    style: "charlotte_mason",
    features: [
      "Writing lifestyle",
      "Freewriting",
      "Poetry teatimes",
      "Movie discussions",
    ],
    pros: [
      "Reduces writing anxiety",
      "Natural approach",
      "Engaging activities",
    ],
    cons: ["Less structured", "Parent learning curve", "Philosophy-heavy"],
    bestFor: [
      "Writing-reluctant students",
      "Creative approach",
      "Charlotte Mason families",
    ],
    category: "subject",
  },
];

// Helper functions
export function getRecommendationsBySubject(
  subject: string,
): CurriculumRecommendation[] {
  return CURRICULUM_RECOMMENDATIONS.filter((r) => r.subjects.includes(subject));
}

export function getRecommendationsByGrade(
  grade: GradeLevel,
): CurriculumRecommendation[] {
  return CURRICULUM_RECOMMENDATIONS.filter((r) =>
    r.gradeLevels.includes(grade),
  );
}

export function getRecommendationsByStyle(
  style: CurriculumRecommendation["style"],
): CurriculumRecommendation[] {
  return CURRICULUM_RECOMMENDATIONS.filter((r) => r.style === style);
}

export function getRecommendationsByPrice(
  price: CurriculumRecommendation["priceRange"],
): CurriculumRecommendation[] {
  return CURRICULUM_RECOMMENDATIONS.filter((r) => r.priceRange === price);
}

export function getRecommendationsByCategory(
  category: CurriculumRecommendation["category"],
): CurriculumRecommendation[] {
  return CURRICULUM_RECOMMENDATIONS.filter((r) => r.category === category);
}

export function searchRecommendations(
  query: string,
): CurriculumRecommendation[] {
  const lower = query.toLowerCase();
  return CURRICULUM_RECOMMENDATIONS.filter(
    (r) =>
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.publisher.toLowerCase().includes(lower) ||
      r.features.some((f) => f.toLowerCase().includes(lower)) ||
      r.bestFor.some((b) => b.toLowerCase().includes(lower)),
  );
}

export function getUniqueSubjects(): string[] {
  const subjects = new Set<string>();
  CURRICULUM_RECOMMENDATIONS.forEach((r) =>
    r.subjects.forEach((s) => subjects.add(s)),
  );
  return Array.from(subjects).sort();
}

export function getUniqueStyles(): CurriculumRecommendation["style"][] {
  const styles = new Set<CurriculumRecommendation["style"]>();
  CURRICULUM_RECOMMENDATIONS.forEach((r) => styles.add(r.style));
  return Array.from(styles);
}
