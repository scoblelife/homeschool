// Learning Standards Data
// Contains Common Core standards for K-2 and custom curriculum support

import type { GradeLevel } from '../shared/types'

export interface LearningStandard {
  id: string
  code: string  // e.g., "CCSS.ELA-LITERACY.RF.1.1"
  title: string
  description: string
  gradeLevel: GradeLevel
  subjectId: string
  domain: string  // e.g., "Reading: Foundational Skills"
  cluster?: string  // e.g., "Print Concepts"
  standardSet: 'common-core' | 'custom'
}

// Common Core Standards for Reading/ELA (K-2)
const readingStandards: LearningStandard[] = [
  // Kindergarten Reading
  {
    id: 'cc-rf-k-1',
    code: 'CCSS.ELA-LITERACY.RF.K.1',
    title: 'Print Concepts',
    description: 'Demonstrate understanding of the organization and basic features of print.',
    gradeLevel: 'k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Print Concepts',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-k-2',
    code: 'CCSS.ELA-LITERACY.RF.K.2',
    title: 'Phonological Awareness',
    description: 'Demonstrate understanding of spoken words, syllables, and sounds (phonemes).',
    gradeLevel: 'k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Phonological Awareness',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-k-3',
    code: 'CCSS.ELA-LITERACY.RF.K.3',
    title: 'Phonics and Word Recognition',
    description: 'Know and apply grade-level phonics and word analysis skills in decoding words.',
    gradeLevel: 'k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Phonics',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-k-4',
    code: 'CCSS.ELA-LITERACY.RF.K.4',
    title: 'Fluency',
    description: 'Read emergent-reader texts with purpose and understanding.',
    gradeLevel: 'k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Fluency',
    standardSet: 'common-core'
  },
  // 1st Grade Reading
  {
    id: 'cc-rf-1-1',
    code: 'CCSS.ELA-LITERACY.RF.1.1',
    title: 'Print Concepts',
    description: 'Demonstrate understanding of the organization and basic features of print.',
    gradeLevel: '1st',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Print Concepts',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-1-2',
    code: 'CCSS.ELA-LITERACY.RF.1.2',
    title: 'Phonological Awareness',
    description: 'Demonstrate understanding of spoken words, syllables, and sounds (phonemes).',
    gradeLevel: '1st',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Phonological Awareness',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-1-3',
    code: 'CCSS.ELA-LITERACY.RF.1.3',
    title: 'Phonics and Word Recognition',
    description: 'Know and apply grade-level phonics and word analysis skills in decoding words.',
    gradeLevel: '1st',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Phonics',
    standardSet: 'common-core'
  },
  {
    id: 'cc-rf-1-4',
    code: 'CCSS.ELA-LITERACY.RF.1.4',
    title: 'Fluency',
    description: 'Read with sufficient accuracy and fluency to support comprehension.',
    gradeLevel: '1st',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Fluency',
    standardSet: 'common-core'
  },
  // Pre-K Reading (based on common early childhood standards)
  {
    id: 'prek-rf-1',
    code: 'PK.RF.1',
    title: 'Book Awareness',
    description: 'Demonstrate understanding of how to handle a book and turn pages.',
    gradeLevel: 'pre-k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Print Concepts',
    standardSet: 'common-core'
  },
  {
    id: 'prek-rf-2',
    code: 'PK.RF.2',
    title: 'Letter Recognition',
    description: 'Recognize and name some upper and lowercase letters.',
    gradeLevel: 'pre-k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Print Concepts',
    standardSet: 'common-core'
  },
  {
    id: 'prek-rf-3',
    code: 'PK.RF.3',
    title: 'Rhyming',
    description: 'Recognize and produce rhyming words.',
    gradeLevel: 'pre-k',
    subjectId: 'reading',
    domain: 'Reading: Foundational Skills',
    cluster: 'Phonological Awareness',
    standardSet: 'common-core'
  }
]

// Common Core Standards for Math (K-2)
const mathStandards: LearningStandard[] = [
  // Pre-K Math
  {
    id: 'prek-cc-1',
    code: 'PK.CC.1',
    title: 'Counting to 10',
    description: 'Count to 10 by ones.',
    gradeLevel: 'pre-k',
    subjectId: 'math',
    domain: 'Counting & Cardinality',
    cluster: 'Know number names and the count sequence',
    standardSet: 'common-core'
  },
  {
    id: 'prek-cc-2',
    code: 'PK.CC.2',
    title: 'Object Counting',
    description: 'Count objects up to 10, using one-to-one correspondence.',
    gradeLevel: 'pre-k',
    subjectId: 'math',
    domain: 'Counting & Cardinality',
    cluster: 'Count to tell the number of objects',
    standardSet: 'common-core'
  },
  {
    id: 'prek-g-1',
    code: 'PK.G.1',
    title: 'Shape Recognition',
    description: 'Identify and describe basic shapes (circle, square, triangle, rectangle).',
    gradeLevel: 'pre-k',
    subjectId: 'math',
    domain: 'Geometry',
    cluster: 'Identify and describe shapes',
    standardSet: 'common-core'
  },
  // Kindergarten Math
  {
    id: 'cc-k-cc-1',
    code: 'CCSS.MATH.CONTENT.K.CC.A.1',
    title: 'Count to 100',
    description: 'Count to 100 by ones and by tens.',
    gradeLevel: 'k',
    subjectId: 'math',
    domain: 'Counting & Cardinality',
    cluster: 'Know number names and the count sequence',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-cc-2',
    code: 'CCSS.MATH.CONTENT.K.CC.A.2',
    title: 'Count Forward',
    description: 'Count forward beginning from a given number within the known sequence.',
    gradeLevel: 'k',
    subjectId: 'math',
    domain: 'Counting & Cardinality',
    cluster: 'Know number names and the count sequence',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-cc-3',
    code: 'CCSS.MATH.CONTENT.K.CC.A.3',
    title: 'Write Numbers 0-20',
    description: 'Write numbers from 0 to 20. Represent a number of objects with a written numeral.',
    gradeLevel: 'k',
    subjectId: 'math',
    domain: 'Counting & Cardinality',
    cluster: 'Know number names and the count sequence',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-oa-1',
    code: 'CCSS.MATH.CONTENT.K.OA.A.1',
    title: 'Addition within 10',
    description: 'Represent addition and subtraction with objects, fingers, drawings, etc.',
    gradeLevel: 'k',
    subjectId: 'math',
    domain: 'Operations & Algebraic Thinking',
    cluster: 'Understand addition',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-g-1',
    code: 'CCSS.MATH.CONTENT.K.G.A.1',
    title: 'Describe Shapes',
    description: 'Describe objects in the environment using names of shapes.',
    gradeLevel: 'k',
    subjectId: 'math',
    domain: 'Geometry',
    cluster: 'Identify and describe shapes',
    standardSet: 'common-core'
  },
  // 1st Grade Math
  {
    id: 'cc-1-oa-1',
    code: 'CCSS.MATH.CONTENT.1.OA.A.1',
    title: 'Addition & Subtraction within 20',
    description: 'Use addition and subtraction within 20 to solve word problems.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Operations & Algebraic Thinking',
    cluster: 'Represent and solve problems',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-oa-3',
    code: 'CCSS.MATH.CONTENT.1.OA.B.3',
    title: 'Commutative Property',
    description: 'Apply properties of operations as strategies to add and subtract.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Operations & Algebraic Thinking',
    cluster: 'Understand properties of operations',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-oa-6',
    code: 'CCSS.MATH.CONTENT.1.OA.C.6',
    title: 'Add & Subtract within 20',
    description: 'Add and subtract within 20, demonstrating fluency for addition and subtraction within 10.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Operations & Algebraic Thinking',
    cluster: 'Add and subtract',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-nbt-1',
    code: 'CCSS.MATH.CONTENT.1.NBT.A.1',
    title: 'Count to 120',
    description: 'Count to 120, starting at any number less than 120.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Number & Operations in Base Ten',
    cluster: 'Extend the counting sequence',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-nbt-2',
    code: 'CCSS.MATH.CONTENT.1.NBT.B.2',
    title: 'Place Value',
    description: 'Understand that the two digits of a two-digit number represent amounts of tens and ones.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Number & Operations in Base Ten',
    cluster: 'Understand place value',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-md-1',
    code: 'CCSS.MATH.CONTENT.1.MD.A.1',
    title: 'Measurement',
    description: 'Order three objects by length; compare the lengths of two objects indirectly.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Measurement & Data',
    cluster: 'Measure lengths',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-g-1',
    code: 'CCSS.MATH.CONTENT.1.G.A.1',
    title: '2D and 3D Shapes',
    description: 'Distinguish between defining attributes of shapes versus non-defining attributes.',
    gradeLevel: '1st',
    subjectId: 'math',
    domain: 'Geometry',
    cluster: 'Reason with shapes',
    standardSet: 'common-core'
  }
]

// Common Core Standards for Writing (K-2)
const writingStandards: LearningStandard[] = [
  // Pre-K Writing
  {
    id: 'prek-w-1',
    code: 'PK.W.1',
    title: 'Drawing & Dictating',
    description: 'Use a combination of drawing, dictating, and writing to express ideas.',
    gradeLevel: 'pre-k',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'prek-w-2',
    code: 'PK.W.2',
    title: 'Name Writing',
    description: 'Write first name using appropriate upper and lower case letters.',
    gradeLevel: 'pre-k',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'prek-l-1',
    code: 'PK.L.1',
    title: 'Letter Formation',
    description: 'Form letters using proper grip and posture.',
    gradeLevel: 'pre-k',
    subjectId: 'writing',
    domain: 'Language',
    cluster: 'Conventions of Standard English',
    standardSet: 'common-core'
  },
  // Kindergarten Writing
  {
    id: 'cc-k-w-1',
    code: 'CCSS.ELA-LITERACY.W.K.1',
    title: 'Opinion Writing',
    description: 'Use a combination of drawing, dictating, and writing to compose opinion pieces.',
    gradeLevel: 'k',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-w-2',
    code: 'CCSS.ELA-LITERACY.W.K.2',
    title: 'Informative Writing',
    description: 'Use a combination of drawing, dictating, and writing to compose informative texts.',
    gradeLevel: 'k',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-w-3',
    code: 'CCSS.ELA-LITERACY.W.K.3',
    title: 'Narrative Writing',
    description: 'Use a combination of drawing, dictating, and writing to narrate a single event.',
    gradeLevel: 'k',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-l-1',
    code: 'CCSS.ELA-LITERACY.L.K.1',
    title: 'Standard English Grammar',
    description: 'Demonstrate command of the conventions of standard English grammar and usage.',
    gradeLevel: 'k',
    subjectId: 'writing',
    domain: 'Language',
    cluster: 'Conventions of Standard English',
    standardSet: 'common-core'
  },
  // 1st Grade Writing
  {
    id: 'cc-1-w-1',
    code: 'CCSS.ELA-LITERACY.W.1.1',
    title: 'Opinion Writing',
    description: 'Write opinion pieces in which they introduce the topic, state an opinion, and provide a reason.',
    gradeLevel: '1st',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-w-2',
    code: 'CCSS.ELA-LITERACY.W.1.2',
    title: 'Informative Writing',
    description: 'Write informative/explanatory texts in which they name a topic and supply some facts.',
    gradeLevel: '1st',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-w-3',
    code: 'CCSS.ELA-LITERACY.W.1.3',
    title: 'Narrative Writing',
    description: 'Write narratives in which they recount two or more appropriately sequenced events.',
    gradeLevel: '1st',
    subjectId: 'writing',
    domain: 'Writing',
    cluster: 'Text Types and Purposes',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-l-1',
    code: 'CCSS.ELA-LITERACY.L.1.1',
    title: 'Grammar & Usage',
    description: 'Demonstrate command of the conventions of standard English grammar and usage.',
    gradeLevel: '1st',
    subjectId: 'writing',
    domain: 'Language',
    cluster: 'Conventions of Standard English',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-l-2',
    code: 'CCSS.ELA-LITERACY.L.1.2',
    title: 'Capitalization & Punctuation',
    description: 'Demonstrate command of the conventions of standard English capitalization and punctuation.',
    gradeLevel: '1st',
    subjectId: 'writing',
    domain: 'Language',
    cluster: 'Conventions of Standard English',
    standardSet: 'common-core'
  }
]

// Science Standards (NGSS-based)
const scienceStandards: LearningStandard[] = [
  // Pre-K Science
  {
    id: 'prek-ls-1',
    code: 'PK.LS.1',
    title: 'Living Things',
    description: 'Identify living vs. non-living things in the environment.',
    gradeLevel: 'pre-k',
    subjectId: 'science',
    domain: 'Life Science',
    cluster: 'Living Things',
    standardSet: 'common-core'
  },
  {
    id: 'prek-ps-1',
    code: 'PK.PS.1',
    title: 'Properties of Objects',
    description: 'Describe objects by their observable properties (color, size, shape).',
    gradeLevel: 'pre-k',
    subjectId: 'science',
    domain: 'Physical Science',
    cluster: 'Matter and Its Interactions',
    standardSet: 'common-core'
  },
  // Kindergarten Science
  {
    id: 'cc-k-ps-1',
    code: 'K-PS2-1',
    title: 'Pushes and Pulls',
    description: 'Plan and conduct an investigation to compare the effects of different pushes and pulls.',
    gradeLevel: 'k',
    subjectId: 'science',
    domain: 'Physical Science',
    cluster: 'Motion and Stability',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-ls-1',
    code: 'K-LS1-1',
    title: 'Living Things Needs',
    description: 'Use observations to describe patterns of what plants and animals need to survive.',
    gradeLevel: 'k',
    subjectId: 'science',
    domain: 'Life Science',
    cluster: 'From Molecules to Organisms',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-ess-1',
    code: 'K-ESS2-1',
    title: 'Local Weather',
    description: 'Use and share observations of local weather conditions to describe patterns.',
    gradeLevel: 'k',
    subjectId: 'science',
    domain: 'Earth Science',
    cluster: "Earth's Systems",
    standardSet: 'common-core'
  },
  // 1st Grade Science
  {
    id: 'cc-1-ps-1',
    code: '1-PS4-1',
    title: 'Sound and Vibrations',
    description: 'Plan and conduct investigations to show that vibrating materials can make sound.',
    gradeLevel: '1st',
    subjectId: 'science',
    domain: 'Physical Science',
    cluster: 'Waves',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ls-1',
    code: '1-LS1-1',
    title: 'Animal Body Parts',
    description: 'Use materials to design a solution to mimic how plants and/or animals use external parts.',
    gradeLevel: '1st',
    subjectId: 'science',
    domain: 'Life Science',
    cluster: 'From Molecules to Organisms',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ls-2',
    code: '1-LS3-1',
    title: 'Inheritance of Traits',
    description: 'Make observations to construct an evidence-based account that young plants/animals are like parents.',
    gradeLevel: '1st',
    subjectId: 'science',
    domain: 'Life Science',
    cluster: 'Heredity',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ess-1',
    code: '1-ESS1-1',
    title: 'Sun, Moon, Stars Patterns',
    description: 'Use observations of the sun, moon, and stars to describe patterns that can be predicted.',
    gradeLevel: '1st',
    subjectId: 'science',
    domain: 'Earth Science',
    cluster: "Earth's Place in the Universe",
    standardSet: 'common-core'
  }
]

// Social Studies Standards
const socialStudiesStandards: LearningStandard[] = [
  // Pre-K Social Studies
  {
    id: 'prek-ss-1',
    code: 'PK.SS.1',
    title: 'Self and Family',
    description: 'Describe self and family members.',
    gradeLevel: 'pre-k',
    subjectId: 'social-studies',
    domain: 'Social Studies',
    cluster: 'Individual Development and Identity',
    standardSet: 'common-core'
  },
  {
    id: 'prek-ss-2',
    code: 'PK.SS.2',
    title: 'Community Helpers',
    description: 'Identify people in the community who help us.',
    gradeLevel: 'pre-k',
    subjectId: 'social-studies',
    domain: 'Social Studies',
    cluster: 'Civic Ideals and Practices',
    standardSet: 'common-core'
  },
  // Kindergarten Social Studies
  {
    id: 'cc-k-ss-1',
    code: 'K.SS.1',
    title: 'Maps and Globes',
    description: 'Use maps and globes to locate places.',
    gradeLevel: 'k',
    subjectId: 'social-studies',
    domain: 'Geography',
    cluster: 'People, Places, and Environments',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-ss-2',
    code: 'K.SS.2',
    title: 'Rules and Laws',
    description: 'Explain why rules and laws are important in the home, school, and community.',
    gradeLevel: 'k',
    subjectId: 'social-studies',
    domain: 'Civics',
    cluster: 'Civic Ideals and Practices',
    standardSet: 'common-core'
  },
  {
    id: 'cc-k-ss-3',
    code: 'K.SS.3',
    title: 'American Symbols',
    description: 'Identify national symbols such as the American flag.',
    gradeLevel: 'k',
    subjectId: 'social-studies',
    domain: 'History',
    cluster: 'Culture',
    standardSet: 'common-core'
  },
  // 1st Grade Social Studies
  {
    id: 'cc-1-ss-1',
    code: '1.SS.1',
    title: 'Needs vs Wants',
    description: 'Distinguish between needs and wants.',
    gradeLevel: '1st',
    subjectId: 'social-studies',
    domain: 'Economics',
    cluster: 'Production, Distribution, and Consumption',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ss-2',
    code: '1.SS.2',
    title: 'Community Geography',
    description: 'Describe the location of places in the community using relative location.',
    gradeLevel: '1st',
    subjectId: 'social-studies',
    domain: 'Geography',
    cluster: 'People, Places, and Environments',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ss-3',
    code: '1.SS.3',
    title: 'Historical Figures',
    description: 'Identify important people from the past who contributed to history.',
    gradeLevel: '1st',
    subjectId: 'social-studies',
    domain: 'History',
    cluster: 'Time, Continuity, and Change',
    standardSet: 'common-core'
  },
  {
    id: 'cc-1-ss-4',
    code: '1.SS.4',
    title: 'Being a Good Citizen',
    description: 'Describe characteristics of good citizenship.',
    gradeLevel: '1st',
    subjectId: 'social-studies',
    domain: 'Civics',
    cluster: 'Civic Ideals and Practices',
    standardSet: 'common-core'
  }
]

// Combine all standards
export const ALL_LEARNING_STANDARDS: LearningStandard[] = [
  ...readingStandards,
  ...mathStandards,
  ...writingStandards,
  ...scienceStandards,
  ...socialStudiesStandards
]

// Helper functions
export function getStandardsByGrade(gradeLevel: GradeLevel): LearningStandard[] {
  return ALL_LEARNING_STANDARDS.filter(s => s.gradeLevel === gradeLevel)
}

export function getStandardsBySubject(subjectId: string): LearningStandard[] {
  return ALL_LEARNING_STANDARDS.filter(s => s.subjectId === subjectId)
}

export function getStandardsByGradeAndSubject(gradeLevel: GradeLevel, subjectId: string): LearningStandard[] {
  return ALL_LEARNING_STANDARDS.filter(s => s.gradeLevel === gradeLevel && s.subjectId === subjectId)
}

export function getStandardById(id: string): LearningStandard | undefined {
  return ALL_LEARNING_STANDARDS.find(s => s.id === id)
}

export function getDomainsBySubject(subjectId: string): string[] {
  const standards = getStandardsBySubject(subjectId)
  return Array.from(new Set(standards.map(s => s.domain)))
}
