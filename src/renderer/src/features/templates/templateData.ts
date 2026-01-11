import type { GradeLevel } from '../../../../shared/types'

export interface ActivityTemplate {
  id: string
  name: string
  description: string
  subjectId: string
  subjectName: string
  grades: GradeLevel[]
  durationMinutes: number
  activityType: 'worksheet' | 'video' | 'reading' | 'writing_print' | 'writing_cursive' | 'hands_on' | 'game' | 'assessment' | 'discussion' | 'project'
  tags: string[]
  materials?: string[]
  instructions?: string
  category: 'core' | 'enrichment' | 'review' | 'assessment'
}

// Sample activity templates organized by subject
export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  // MATH TEMPLATES
  {
    id: 'math-counting-1-20',
    name: 'Counting Practice 1-20',
    description: 'Practice counting objects and numbers from 1 to 20',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['pre-k', 'k'],
    durationMinutes: 15,
    activityType: 'worksheet',
    tags: ['counting', 'numbers', 'beginner'],
    materials: ['Counting objects (blocks, buttons, etc.)', 'Number cards'],
    instructions: 'Have student count objects and match to written numbers.',
    category: 'core'
  },
  {
    id: 'math-addition-facts',
    name: 'Addition Facts Practice',
    description: 'Practice basic addition facts within 10',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'worksheet',
    tags: ['addition', 'math facts', 'practice'],
    materials: ['Addition worksheet', 'Manipulatives for counting'],
    category: 'core'
  },
  {
    id: 'math-subtraction-facts',
    name: 'Subtraction Facts Practice',
    description: 'Practice basic subtraction facts within 10',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'worksheet',
    tags: ['subtraction', 'math facts', 'practice'],
    materials: ['Subtraction worksheet', 'Manipulatives'],
    category: 'core'
  },
  {
    id: 'math-shapes',
    name: 'Shape Recognition',
    description: 'Identify and name basic 2D shapes',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['pre-k', 'k'],
    durationMinutes: 15,
    activityType: 'hands_on',
    tags: ['shapes', 'geometry', 'visual'],
    materials: ['Shape blocks or cutouts', 'Shape sorting chart'],
    category: 'core'
  },
  {
    id: 'math-patterns',
    name: 'Pattern Recognition',
    description: 'Identify, extend, and create patterns',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 20,
    activityType: 'hands_on',
    tags: ['patterns', 'logic', 'visual'],
    materials: ['Pattern blocks', 'Colored beads or objects'],
    category: 'core'
  },
  {
    id: 'math-word-problems',
    name: 'Story Problems',
    description: 'Solve simple addition and subtraction word problems',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['1st'],
    durationMinutes: 25,
    activityType: 'worksheet',
    tags: ['word problems', 'addition', 'subtraction', 'reading'],
    category: 'core'
  },
  {
    id: 'math-place-value',
    name: 'Place Value Practice',
    description: 'Understand tens and ones place value',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['1st'],
    durationMinutes: 20,
    activityType: 'hands_on',
    tags: ['place value', 'tens', 'ones', 'number sense'],
    materials: ['Base ten blocks', 'Place value mat'],
    category: 'core'
  },
  {
    id: 'math-game-dice',
    name: 'Math Dice Game',
    description: 'Practice addition using dice',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['k', '1st'],
    durationMinutes: 15,
    activityType: 'game',
    tags: ['addition', 'game', 'fun'],
    materials: ['Two dice', 'Paper for keeping score'],
    category: 'enrichment'
  },

  // READING TEMPLATES
  {
    id: 'reading-sight-words',
    name: 'Sight Word Practice',
    description: 'Learn and practice high-frequency sight words',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 15,
    activityType: 'reading',
    tags: ['sight words', 'vocabulary', 'fluency'],
    materials: ['Sight word flashcards', 'Sight word list'],
    category: 'core'
  },
  {
    id: 'reading-phonics',
    name: 'Phonics Lesson',
    description: 'Practice letter sounds and blending',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 20,
    activityType: 'reading',
    tags: ['phonics', 'sounds', 'blending'],
    materials: ['Letter cards', 'Phonics worksheet'],
    category: 'core'
  },
  {
    id: 'reading-read-aloud',
    name: 'Read Aloud Session',
    description: 'Read a book aloud together with discussion',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 30,
    activityType: 'reading',
    tags: ['read aloud', 'comprehension', 'discussion'],
    materials: ['Age-appropriate book'],
    instructions: 'Read together, pause to discuss, ask comprehension questions.',
    category: 'core'
  },
  {
    id: 'reading-independent',
    name: 'Independent Reading',
    description: 'Student reads independently at their level',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'reading',
    tags: ['independent', 'practice', 'fluency'],
    materials: ['Level-appropriate books'],
    category: 'core'
  },
  {
    id: 'reading-comprehension',
    name: 'Reading Comprehension Activity',
    description: 'Answer questions about a story',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['k', '1st'],
    durationMinutes: 25,
    activityType: 'worksheet',
    tags: ['comprehension', 'questions', 'understanding'],
    materials: ['Story or passage', 'Comprehension questions'],
    category: 'core'
  },
  {
    id: 'reading-letter-recognition',
    name: 'Letter Recognition',
    description: 'Identify uppercase and lowercase letters',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['pre-k', 'k'],
    durationMinutes: 15,
    activityType: 'hands_on',
    tags: ['letters', 'alphabet', 'recognition'],
    materials: ['Letter cards', 'Magnetic letters'],
    category: 'core'
  },

  // WRITING TEMPLATES
  {
    id: 'writing-letter-formation',
    name: 'Letter Formation Practice',
    description: 'Practice forming letters correctly',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['pre-k', 'k'],
    durationMinutes: 15,
    activityType: 'writing_print',
    tags: ['letters', 'handwriting', 'formation'],
    materials: ['Letter tracing sheets', 'Pencil'],
    category: 'core'
  },
  {
    id: 'writing-name-practice',
    name: 'Name Writing Practice',
    description: 'Practice writing first and last name',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['pre-k', 'k'],
    durationMinutes: 10,
    activityType: 'writing_print',
    tags: ['name', 'handwriting', 'personal'],
    category: 'core'
  },
  {
    id: 'writing-sentence-practice',
    name: 'Sentence Writing',
    description: 'Practice writing complete sentences',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'writing_print',
    tags: ['sentences', 'punctuation', 'capitalization'],
    materials: ['Writing paper', 'Pencil'],
    category: 'core'
  },
  {
    id: 'writing-journal',
    name: 'Journal Writing',
    description: 'Write about personal experiences or a prompt',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'writing_print',
    tags: ['journal', 'creative', 'personal'],
    materials: ['Journal or writing paper'],
    category: 'enrichment'
  },
  {
    id: 'writing-copywork',
    name: 'Copywork',
    description: 'Copy a short passage or poem',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['k', '1st'],
    durationMinutes: 15,
    activityType: 'writing_print',
    tags: ['copywork', 'handwriting', 'spelling'],
    materials: ['Passage to copy', 'Writing paper'],
    category: 'core'
  },

  // SCIENCE TEMPLATES
  {
    id: 'science-nature-walk',
    name: 'Nature Walk & Observation',
    description: 'Observe and document nature outdoors',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 45,
    activityType: 'hands_on',
    tags: ['nature', 'observation', 'outdoor'],
    materials: ['Nature journal', 'Magnifying glass', 'Collection bag'],
    category: 'enrichment'
  },
  {
    id: 'science-simple-experiment',
    name: 'Simple Science Experiment',
    description: 'Conduct a hands-on science experiment',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 30,
    activityType: 'hands_on',
    tags: ['experiment', 'hands-on', 'discovery'],
    instructions: 'Follow scientific method: question, predict, test, observe, conclude.',
    category: 'enrichment'
  },
  {
    id: 'science-animal-study',
    name: 'Animal Study',
    description: 'Learn about a specific animal and its habitat',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 30,
    activityType: 'reading',
    tags: ['animals', 'habitats', 'biology'],
    materials: ['Animal books or videos', 'Drawing supplies'],
    category: 'core'
  },
  {
    id: 'science-five-senses',
    name: 'Five Senses Activity',
    description: 'Explore the five senses through activities',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k'],
    durationMinutes: 25,
    activityType: 'hands_on',
    tags: ['senses', 'body', 'exploration'],
    materials: ['Various sensory objects'],
    category: 'core'
  },
  {
    id: 'science-weather',
    name: 'Weather Observation',
    description: 'Observe and record daily weather',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 10,
    activityType: 'hands_on',
    tags: ['weather', 'observation', 'recording'],
    materials: ['Weather chart', 'Thermometer'],
    category: 'core'
  },
  {
    id: 'science-plant-growth',
    name: 'Plant Growth Study',
    description: 'Observe and document plant growth',
    subjectId: 'science',
    subjectName: 'Science',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 15,
    activityType: 'hands_on',
    tags: ['plants', 'growth', 'observation'],
    materials: ['Seeds', 'Planting supplies', 'Journal'],
    category: 'enrichment'
  },

  // SOCIAL STUDIES TEMPLATES
  {
    id: 'social-community-helpers',
    name: 'Community Helpers',
    description: 'Learn about people who help in our community',
    subjectId: 'social-studies',
    subjectName: 'Social Studies',
    grades: ['pre-k', 'k'],
    durationMinutes: 25,
    activityType: 'discussion',
    tags: ['community', 'helpers', 'jobs'],
    materials: ['Books about community helpers', 'Pictures'],
    category: 'core'
  },
  {
    id: 'social-maps',
    name: 'Map Skills',
    description: 'Introduction to maps and basic geography',
    subjectId: 'social-studies',
    subjectName: 'Social Studies',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'hands_on',
    tags: ['maps', 'geography', 'directions'],
    materials: ['Maps', 'Globe'],
    category: 'core'
  },
  {
    id: 'social-family',
    name: 'Family & Relationships',
    description: 'Discuss family members and relationships',
    subjectId: 'social-studies',
    subjectName: 'Social Studies',
    grades: ['pre-k', 'k'],
    durationMinutes: 20,
    activityType: 'discussion',
    tags: ['family', 'relationships', 'personal'],
    materials: ['Family photos', 'Drawing supplies'],
    category: 'core'
  },
  {
    id: 'social-holidays',
    name: 'Holiday & Cultural Celebrations',
    description: 'Learn about holidays and traditions',
    subjectId: 'social-studies',
    subjectName: 'Social Studies',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 30,
    activityType: 'reading',
    tags: ['holidays', 'culture', 'traditions'],
    materials: ['Holiday books', 'Craft supplies'],
    category: 'enrichment'
  },
  {
    id: 'social-history-story',
    name: 'Historical Story',
    description: 'Read and discuss a story about historical figures',
    subjectId: 'social-studies',
    subjectName: 'Social Studies',
    grades: ['k', '1st'],
    durationMinutes: 25,
    activityType: 'reading',
    tags: ['history', 'biography', 'reading'],
    materials: ['Age-appropriate biography or history book'],
    category: 'enrichment'
  },

  // ART TEMPLATES
  {
    id: 'art-drawing',
    name: 'Drawing Activity',
    description: 'Free drawing or guided drawing activity',
    subjectId: 'art',
    subjectName: 'Art',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 30,
    activityType: 'hands_on',
    tags: ['drawing', 'creative', 'art'],
    materials: ['Paper', 'Crayons or markers', 'Colored pencils'],
    category: 'enrichment'
  },
  {
    id: 'art-painting',
    name: 'Painting Activity',
    description: 'Paint a picture using various techniques',
    subjectId: 'art',
    subjectName: 'Art',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 45,
    activityType: 'hands_on',
    tags: ['painting', 'creative', 'art'],
    materials: ['Paints', 'Brushes', 'Paper or canvas'],
    category: 'enrichment'
  },
  {
    id: 'art-craft-project',
    name: 'Craft Project',
    description: 'Complete a themed craft project',
    subjectId: 'art',
    subjectName: 'Art',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 45,
    activityType: 'hands_on',
    tags: ['craft', 'creative', 'project'],
    materials: ['Craft supplies as needed'],
    category: 'enrichment'
  },

  // MUSIC TEMPLATES
  {
    id: 'music-songs',
    name: 'Singing Time',
    description: 'Learn and sing educational songs',
    subjectId: 'music',
    subjectName: 'Music',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 15,
    activityType: 'hands_on',
    tags: ['singing', 'music', 'fun'],
    category: 'enrichment'
  },
  {
    id: 'music-rhythm',
    name: 'Rhythm Practice',
    description: 'Practice clapping and rhythm patterns',
    subjectId: 'music',
    subjectName: 'Music',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 15,
    activityType: 'hands_on',
    tags: ['rhythm', 'patterns', 'music'],
    materials: ['Rhythm instruments (optional)'],
    category: 'enrichment'
  },

  // PHYSICAL EDUCATION TEMPLATES
  {
    id: 'pe-outdoor-play',
    name: 'Outdoor Active Play',
    description: 'Physical activity and play outdoors',
    subjectId: 'pe',
    subjectName: 'Physical Education',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 45,
    activityType: 'hands_on',
    tags: ['outdoor', 'active', 'play'],
    materials: ['Outdoor play equipment'],
    category: 'enrichment'
  },
  {
    id: 'pe-gross-motor',
    name: 'Gross Motor Activities',
    description: 'Activities to develop large muscle skills',
    subjectId: 'pe',
    subjectName: 'Physical Education',
    grades: ['pre-k', 'k', '1st'],
    durationMinutes: 20,
    activityType: 'hands_on',
    tags: ['motor skills', 'movement', 'physical'],
    instructions: 'Include jumping, hopping, throwing, catching, balancing.',
    category: 'enrichment'
  },

  // ASSESSMENT TEMPLATES
  {
    id: 'assessment-math-quiz',
    name: 'Math Quick Check',
    description: 'Brief assessment of math skills',
    subjectId: 'math',
    subjectName: 'Math',
    grades: ['k', '1st'],
    durationMinutes: 15,
    activityType: 'assessment',
    tags: ['assessment', 'math', 'quiz'],
    category: 'assessment'
  },
  {
    id: 'assessment-reading',
    name: 'Reading Assessment',
    description: 'Assess reading fluency and comprehension',
    subjectId: 'reading',
    subjectName: 'Reading',
    grades: ['k', '1st'],
    durationMinutes: 20,
    activityType: 'assessment',
    tags: ['assessment', 'reading', 'fluency'],
    category: 'assessment'
  },
  {
    id: 'assessment-spelling',
    name: 'Spelling Test',
    description: 'Weekly spelling word assessment',
    subjectId: 'writing',
    subjectName: 'Writing',
    grades: ['k', '1st'],
    durationMinutes: 15,
    activityType: 'assessment',
    tags: ['assessment', 'spelling', 'writing'],
    category: 'assessment'
  }
]

// Helper functions
export function getTemplatesBySubject(subjectId: string): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(t => t.subjectId === subjectId)
}

export function getTemplatesByGrade(grade: GradeLevel): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(t => t.grades.includes(grade))
}

export function getTemplatesByCategory(category: ActivityTemplate['category']): ActivityTemplate[] {
  return ACTIVITY_TEMPLATES.filter(t => t.category === category)
}

export function searchTemplates(query: string): ActivityTemplate[] {
  const lower = query.toLowerCase()
  return ACTIVITY_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  )
}

export function getTemplateById(id: string): ActivityTemplate | undefined {
  return ACTIVITY_TEMPLATES.find(t => t.id === id)
}

export function getUniqueSubjects(): Array<{ id: string; name: string }> {
  const subjects = new Map<string, string>()
  ACTIVITY_TEMPLATES.forEach(t => {
    if (!subjects.has(t.subjectId)) {
      subjects.set(t.subjectId, t.subjectName)
    }
  })
  return Array.from(subjects.entries()).map(([id, name]) => ({ id, name }))
}

export function getUniqueTags(): string[] {
  const tags = new Set<string>()
  ACTIVITY_TEMPLATES.forEach(t => t.tags.forEach(tag => tags.add(tag)))
  return Array.from(tags).sort()
}
