import type { GradeLevel } from '../shared/types'

export interface ResourceTemplate {
  type: 'url'
  title: string
  url: string
}

export interface MilestoneTemplateData {
  gradeLevel: GradeLevel
  subjectId: string
  title: string
  description: string
  category: string
  resources?: ResourceTemplate[]
}

// Helper to generate template ID
function id(grade: string, subject: string, num: number): string {
  return `${grade}-${subject}-${num.toString().padStart(3, '0')}`
}

export const milestoneTemplates: MilestoneTemplateData[] = [
  // ============================================
  // PRE-K MILESTONES
  // ============================================

  // Pre-K Mathematics
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Counting', title: 'Count to 10', description: 'Verbally count from 1 to 10 in sequence', resources: [
    { type: 'url', title: 'Mathseeds - Counting to 10', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Numbers & Counting', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Counting', title: 'Count to 20', description: 'Verbally count from 1 to 20 in sequence', resources: [
    { type: 'url', title: 'Mathseeds - Counting to 20', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Counting Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Counting', title: 'Count objects to 10', description: 'Count up to 10 objects with one-to-one correspondence', resources: [
    { type: 'url', title: 'Mathseeds - Object Counting', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Counting Objects', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Numbers', title: 'Recognize numbers 0-10', description: 'Identify written numerals 0 through 10', resources: [
    { type: 'url', title: 'Mathseeds - Number Recognition', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Number Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Numbers', title: 'Write numbers 0-5', description: 'Write numerals 0 through 5 legibly', resources: [
    { type: 'url', title: 'ABC Mouse - Number Writing Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Shapes', title: 'Identify circle', description: 'Recognize and name circles in the environment', resources: [
    { type: 'url', title: 'Mathseeds - Shapes: Circles', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Shape Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Shapes', title: 'Identify square', description: 'Recognize and name squares in the environment', resources: [
    { type: 'url', title: 'Mathseeds - Shapes: Squares', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Shape Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Shapes', title: 'Identify triangle', description: 'Recognize and name triangles in the environment', resources: [
    { type: 'url', title: 'Mathseeds - Shapes: Triangles', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Shape Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Shapes', title: 'Identify rectangle', description: 'Recognize and name rectangles in the environment', resources: [
    { type: 'url', title: 'Mathseeds - Shapes: Rectangles', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Shape Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Concepts', title: 'Understand more/less', description: 'Compare two groups and identify which has more or less', resources: [
    { type: 'url', title: 'Mathseeds - Comparing Numbers', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - More and Less', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Concepts', title: 'Understand big/small', description: 'Compare objects by size using big and small', resources: [
    { type: 'url', title: 'ABC Mouse - Size Comparison', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Sorting', title: 'Sort by color', description: 'Sort objects into groups by color', resources: [
    { type: 'url', title: 'Mathseeds - Sorting Activities', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Color Sorting', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Sorting', title: 'Sort by size', description: 'Sort objects into groups by size', resources: [
    { type: 'url', title: 'Mathseeds - Sorting by Size', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Size Sorting', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Sorting', title: 'Sort by shape', description: 'Sort objects into groups by shape', resources: [
    { type: 'url', title: 'Mathseeds - Sorting by Shape', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Shape Sorting', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'math', category: 'Patterns', title: 'Recognize AB patterns', description: 'Identify and continue simple AB patterns', resources: [
    { type: 'url', title: 'Mathseeds - Pattern Recognition', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Pattern Activities', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Reading
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Letters', title: 'Recognize uppercase letters', description: 'Identify all 26 uppercase letters', resources: [
    { type: 'url', title: 'Reading Eggs - Letter Recognition', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Alphabet Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Letters', title: 'Recognize lowercase letters', description: 'Identify all 26 lowercase letters', resources: [
    { type: 'url', title: 'Reading Eggs - Lowercase Letters', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Letter Learning', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Phonics', title: 'Letter sounds A-M', description: 'Associate letters A through M with their sounds', resources: [
    { type: 'url', title: 'Reading Eggs - Phonics Lessons', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Letter Sounds', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Phonics', title: 'Letter sounds N-Z', description: 'Associate letters N through Z with their sounds', resources: [
    { type: 'url', title: 'Reading Eggs - Phonics Lessons', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Letter Sounds', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Phonics', title: 'Identify rhyming words', description: 'Recognize when two words rhyme', resources: [
    { type: 'url', title: 'Reading Eggs - Rhyming Games', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Rhyming Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Phonics', title: 'Identify beginning sounds', description: 'Identify the beginning sound in spoken words', resources: [
    { type: 'url', title: 'Reading Eggs - Beginning Sounds', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Phonemic Awareness', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Concepts', title: 'Hold book correctly', description: 'Hold a book right-side up and turn pages front to back', resources: [
    { type: 'url', title: 'ABC Mouse - Book Handling', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Concepts', title: 'Understand print direction', description: 'Know that we read left to right, top to bottom', resources: [
    { type: 'url', title: 'Reading Eggs - Reading Basics', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Print Concepts', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Comprehension', title: 'Retell a story', description: 'Retell main events of a familiar story in sequence', resources: [
    { type: 'url', title: 'Reading Eggs - Story Time', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Stories & Books', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Comprehension', title: 'Answer questions about stories', description: 'Answer who, what, where questions about read-alouds', resources: [
    { type: 'url', title: 'Reading Eggs - Comprehension', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Story Questions', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'reading', category: 'Vocabulary', title: 'Name common objects', description: 'Name everyday objects in pictures and environment', resources: [
    { type: 'url', title: 'ABC Mouse - Vocabulary Builder', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Writing
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Motor Skills', title: 'Proper pencil grip', description: 'Hold pencil with tripod grip (thumb, index, middle finger)', resources: [
    { type: 'url', title: 'ABC Mouse - Writing Basics', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Motor Skills', title: 'Trace straight lines', description: 'Trace vertical and horizontal lines accurately', resources: [
    { type: 'url', title: 'ABC Mouse - Tracing Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Motor Skills', title: 'Trace curved lines', description: 'Trace curved and wavy lines accurately', resources: [
    { type: 'url', title: 'ABC Mouse - Tracing Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Motor Skills', title: 'Trace shapes', description: 'Trace basic shapes (circle, square, triangle)', resources: [
    { type: 'url', title: 'ABC Mouse - Shape Tracing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Letters', title: 'Write first name', description: 'Write first name with correct letter formation', resources: [
    { type: 'url', title: 'ABC Mouse - Name Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Letters', title: 'Write uppercase letters', description: 'Write recognizable uppercase letters A-Z', resources: [
    { type: 'url', title: 'ABC Mouse - Letter Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Drawing', title: 'Draw a person', description: 'Draw a person with head, body, arms, and legs', resources: [
    { type: 'url', title: 'ABC Mouse - Art Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'writing', category: 'Drawing', title: 'Draw recognizable pictures', description: 'Create drawings that represent real objects', resources: [
    { type: 'url', title: 'ABC Mouse - Drawing Games', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Science
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Living Things', title: 'Identify plants vs animals', description: 'Distinguish between plants and animals', resources: [
    { type: 'url', title: 'ABC Mouse - Science: Living Things', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Living Things', title: 'Name body parts', description: 'Identify and name major body parts', resources: [
    { type: 'url', title: 'ABC Mouse - Body Parts', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Living Things', title: 'Identify 5 senses', description: 'Name the five senses and their purposes', resources: [
    { type: 'url', title: 'ABC Mouse - Five Senses', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Nature', title: 'Name 4 seasons', description: 'Identify and describe the four seasons', resources: [
    { type: 'url', title: 'ABC Mouse - Seasons', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Nature', title: 'Describe weather', description: 'Describe daily weather conditions (sunny, rainy, cloudy)', resources: [
    { type: 'url', title: 'ABC Mouse - Weather', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Nature', title: 'Observe nature changes', description: 'Notice and describe changes in nature over time', resources: [
    { type: 'url', title: 'ABC Mouse - Nature Exploration', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Animals', title: 'Farm animals', description: 'Identify common farm animals and their sounds', resources: [
    { type: 'url', title: 'ABC Mouse - Farm Animals', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'science', category: 'Animals', title: 'Zoo animals', description: 'Identify common zoo animals', resources: [
    { type: 'url', title: 'ABC Mouse - Zoo Animals', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Social Studies
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Self', title: 'Know full name', description: 'State first and last name', resources: [
    { type: 'url', title: 'ABC Mouse - All About Me', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Self', title: 'Know age and birthday', description: 'State age and when birthday is', resources: [
    { type: 'url', title: 'ABC Mouse - Personal Information', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Family', title: 'Identify family members', description: 'Name immediate family members and relationships', resources: [
    { type: 'url', title: 'ABC Mouse - My Family', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Community', title: 'Community helpers', description: 'Identify community helpers (firefighter, doctor, teacher)', resources: [
    { type: 'url', title: 'ABC Mouse - Community Helpers', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Community', title: 'Know home address', description: 'Know street name or general location of home', resources: [
    { type: 'url', title: 'ABC Mouse - My Neighborhood', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Citizenship', title: 'Follow rules', description: 'Understand and follow simple rules', resources: [
    { type: 'url', title: 'ABC Mouse - Rules & Citizenship', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'social-studies', category: 'Citizenship', title: 'Take turns', description: 'Wait for turn and share with others', resources: [
    { type: 'url', title: 'ABC Mouse - Sharing & Caring', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Life Skills
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Self-Care', title: 'Wash hands properly', description: 'Wash hands with soap and water independently', resources: [
    { type: 'url', title: 'ABC Mouse - Health & Hygiene', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Self-Care', title: 'Use bathroom independently', description: 'Use toilet, wipe, and flush without help', resources: [
    { type: 'url', title: 'ABC Mouse - Potty Training', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Self-Care', title: 'Put on coat', description: 'Put on and zip/button coat independently', resources: [
    { type: 'url', title: 'ABC Mouse - Getting Dressed', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Self-Care', title: 'Put on shoes', description: 'Put on shoes (velcro or slip-on)', resources: [
    { type: 'url', title: 'ABC Mouse - Self-Care Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Express emotions', description: 'Use words to express feelings (happy, sad, angry)', resources: [
    { type: 'url', title: 'ABC Mouse - Feelings & Emotions', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Play cooperatively', description: 'Play with others without constant conflict', resources: [
    { type: 'url', title: 'ABC Mouse - Social Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Responsibility', title: 'Clean up toys', description: 'Put away toys and materials when finished', resources: [
    { type: 'url', title: 'ABC Mouse - Responsibility', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'life-skills', category: 'Responsibility', title: 'Follow 2-step directions', description: 'Follow directions with two steps', resources: [
    { type: 'url', title: 'ABC Mouse - Following Directions', url: 'https://www.abcmouse.com/' }
  ]},

  // Pre-K Physical Education
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Run', description: 'Run with coordination and control', resources: [
    { type: 'url', title: 'GoNoodle - Movement Videos', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Jump with two feet', description: 'Jump forward with both feet leaving ground', resources: [
    { type: 'url', title: 'GoNoodle - Jumping Activities', url: 'https://www.gonoodle.com/' },
    { type: 'url', title: 'Cosmic Kids Yoga', url: 'https://www.cosmickids.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Hop on one foot', description: 'Hop on one foot several times', resources: [
    { type: 'url', title: 'GoNoodle - Hopping Games', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Climb stairs alternating', description: 'Walk up stairs alternating feet', resources: [
    { type: 'url', title: 'GoNoodle - Gross Motor Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Balance', title: 'Balance on one foot', description: 'Balance on one foot for 5+ seconds', resources: [
    { type: 'url', title: 'Cosmic Kids Yoga - Balance', url: 'https://www.cosmickids.com/' },
    { type: 'url', title: 'GoNoodle - Balance Activities', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Balance', title: 'Walk on a line', description: 'Walk along a straight line without stepping off', resources: [
    { type: 'url', title: 'GoNoodle - Balance Games', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Catch large ball', description: 'Catch a large ball with both hands', resources: [
    { type: 'url', title: 'GoNoodle - Ball Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Throw underhand', description: 'Throw a ball underhand toward a target', resources: [
    { type: 'url', title: 'GoNoodle - Throwing Practice', url: 'https://www.gonoodle.com/' }
  ]},

  // Pre-K Art & Music
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Art', title: 'Use scissors', description: 'Cut along a straight line with scissors', resources: [
    { type: 'url', title: 'ABC Mouse - Art Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Art', title: 'Color in lines', description: 'Color mostly within the lines of a picture', resources: [
    { type: 'url', title: 'ABC Mouse - Coloring Pages', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Art', title: 'Name colors', description: 'Identify and name basic colors', resources: [
    { type: 'url', title: 'ABC Mouse - Colors', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Art', title: 'Create with playdough', description: 'Manipulate playdough to create shapes and objects', resources: [
    { type: 'url', title: 'ABC Mouse - Art & Creativity', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Music', title: 'Sing simple songs', description: 'Sing along to familiar songs', resources: [
    { type: 'url', title: 'ABC Mouse - Music & Songs', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Music', title: 'Keep a beat', description: 'Clap or tap along to a steady beat', resources: [
    { type: 'url', title: 'ABC Mouse - Rhythm Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: 'pre-k', subjectId: 'art-music', category: 'Music', title: 'Move to music', description: 'Dance and move body in response to music', resources: [
    { type: 'url', title: 'ABC Mouse - Dance & Movement', url: 'https://www.abcmouse.com/' }
  ]},

  // ============================================
  // 1ST GRADE MILESTONES
  // ============================================

  // 1st Grade Mathematics
  { gradeLevel: '1st', subjectId: 'math', category: 'Counting', title: 'Count to 100', description: 'Count forward from any number to 100', resources: [
    { type: 'url', title: 'Mathseeds - Counting to 100', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - 1st Grade Math', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Counting', title: 'Count by 2s to 20', description: 'Skip count by 2s up to 20', resources: [
    { type: 'url', title: 'Mathseeds - Skip Counting', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Skip Counting by 2s', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Counting', title: 'Count by 5s to 100', description: 'Skip count by 5s up to 100', resources: [
    { type: 'url', title: 'Mathseeds - Skip Counting by 5s', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Counting by 5s', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Counting', title: 'Count by 10s to 100', description: 'Skip count by 10s up to 100', resources: [
    { type: 'url', title: 'Mathseeds - Skip Counting by 10s', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Counting by 10s', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Addition', title: 'Add within 10', description: 'Fluently add numbers with sums up to 10', resources: [
    { type: 'url', title: 'Mathseeds - Addition Basics', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Addition Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Addition', title: 'Add within 20', description: 'Add numbers with sums up to 20', resources: [
    { type: 'url', title: 'Mathseeds - Addition to 20', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Addition Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Subtraction', title: 'Subtract within 10', description: 'Fluently subtract numbers within 10', resources: [
    { type: 'url', title: 'Mathseeds - Subtraction Basics', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Subtraction Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Subtraction', title: 'Subtract within 20', description: 'Subtract numbers within 20', resources: [
    { type: 'url', title: 'Mathseeds - Subtraction to 20', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Subtraction Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Place Value', title: 'Understand tens and ones', description: 'Identify tens and ones place in two-digit numbers', resources: [
    { type: 'url', title: 'Mathseeds - Place Value', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Tens and Ones', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Place Value', title: 'Compare two-digit numbers', description: 'Compare two-digit numbers using >, <, =', resources: [
    { type: 'url', title: 'Mathseeds - Comparing Numbers', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Greater Than Less Than', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Time', title: 'Tell time to the hour', description: 'Read analog clock to the hour', resources: [
    { type: 'url', title: 'Mathseeds - Telling Time', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Clock Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Time', title: 'Tell time to half hour', description: 'Read analog clock to the half hour', resources: [
    { type: 'url', title: 'Mathseeds - Time to Half Hour', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Half Hour Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Measurement', title: 'Measure with units', description: 'Measure length using non-standard units', resources: [
    { type: 'url', title: 'Mathseeds - Measurement', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Measuring Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Geometry', title: 'Identify 3D shapes', description: 'Identify cubes, cones, cylinders, spheres', resources: [
    { type: 'url', title: 'Mathseeds - 3D Shapes', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Solid Shapes', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'math', category: 'Geometry', title: 'Partition shapes', description: 'Divide circles and rectangles into halves and fourths', resources: [
    { type: 'url', title: 'Mathseeds - Fractions Intro', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Halves and Fourths', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Reading
  { gradeLevel: '1st', subjectId: 'reading', category: 'Phonics', title: 'Read CVC words', description: 'Decode consonant-vowel-consonant words', resources: [
    { type: 'url', title: 'Reading Eggs - CVC Words', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Phonics: CVC', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Phonics', title: 'Read CVCe words', description: 'Decode words with silent e (like, make, bike)', resources: [
    { type: 'url', title: 'Reading Eggs - Silent E Words', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Magic E', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Phonics', title: 'Read consonant blends', description: 'Decode words with blends (bl, cr, st, etc.)', resources: [
    { type: 'url', title: 'Reading Eggs - Consonant Blends', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Blends Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Phonics', title: 'Read consonant digraphs', description: 'Decode words with digraphs (sh, ch, th, wh)', resources: [
    { type: 'url', title: 'Reading Eggs - Digraphs', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Digraph Lessons', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Sight Words', title: 'Read Dolch Pre-Primer words', description: 'Read 40 pre-primer sight words automatically', resources: [
    { type: 'url', title: 'Reading Eggs - Sight Words', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Pre-Primer Words', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Sight Words', title: 'Read Dolch Primer words', description: 'Read 52 primer sight words automatically', resources: [
    { type: 'url', title: 'Reading Eggs - Primer Sight Words', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Sight Word Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Sight Words', title: 'Read Dolch 1st Grade words', description: 'Read 41 first grade sight words automatically', resources: [
    { type: 'url', title: 'Reading Eggs - 1st Grade Words', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - First Grade Sight Words', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Fluency', title: 'Read simple sentences', description: 'Read simple sentences smoothly', resources: [
    { type: 'url', title: 'Reading Eggs - Sentence Reading', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Reading Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Fluency', title: 'Read with expression', description: 'Read aloud with appropriate expression', resources: [
    { type: 'url', title: 'Reading Eggs - Fluency Practice', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Expressive Reading', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Comprehension', title: 'Identify main idea', description: 'State the main idea of a passage', resources: [
    { type: 'url', title: 'Reading Eggs - Main Idea', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Comprehension Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Comprehension', title: 'Retell story in order', description: 'Retell story events in sequence', resources: [
    { type: 'url', title: 'Reading Eggs - Story Sequence', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Retelling Stories', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Comprehension', title: 'Make predictions', description: 'Predict what will happen next in a story', resources: [
    { type: 'url', title: 'Reading Eggs - Making Predictions', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Story Predictions', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'reading', category: 'Comprehension', title: 'Identify characters and setting', description: 'Name characters and describe story setting', resources: [
    { type: 'url', title: 'Reading Eggs - Story Elements', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Characters & Setting', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Writing
  { gradeLevel: '1st', subjectId: 'writing', category: 'Handwriting', title: 'Write lowercase letters', description: 'Form all lowercase letters correctly', resources: [
    { type: 'url', title: 'ABC Mouse - Letter Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Handwriting', title: 'Write uppercase letters', description: 'Form all uppercase letters correctly', resources: [
    { type: 'url', title: 'ABC Mouse - Uppercase Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Handwriting', title: 'Proper spacing', description: 'Leave appropriate spaces between words', resources: [
    { type: 'url', title: 'ABC Mouse - Handwriting Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Handwriting', title: 'Write on lines', description: 'Write letters on the baseline consistently', resources: [
    { type: 'url', title: 'ABC Mouse - Line Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Sentences', title: 'Write complete sentences', description: 'Write sentences with capital and period', resources: [
    { type: 'url', title: 'Reading Eggs - Sentence Building', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Sentence Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Sentences', title: 'Use question marks', description: 'Use question marks for questions', resources: [
    { type: 'url', title: 'ABC Mouse - Punctuation', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Sentences', title: 'Use exclamation points', description: 'Use exclamation points for emphasis', resources: [
    { type: 'url', title: 'ABC Mouse - Punctuation Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Spelling', title: 'Spell CVC words', description: 'Correctly spell CVC words', resources: [
    { type: 'url', title: 'Reading Eggs - Spelling CVC', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Spelling Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Spelling', title: 'Spell sight words', description: 'Correctly spell common sight words', resources: [
    { type: 'url', title: 'Reading Eggs - Sight Word Spelling', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'ABC Mouse - Spelling Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Composition', title: 'Write 3+ sentences on topic', description: 'Write multiple sentences about one topic', resources: [
    { type: 'url', title: 'ABC Mouse - Story Writing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'writing', category: 'Cursive', title: 'Cursive letter recognition', description: 'Recognize cursive letters (introduction)', resources: [
    { type: 'url', title: 'ABC Mouse - Cursive Introduction', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Science
  { gradeLevel: '1st', subjectId: 'science', category: 'Life Science', title: 'Living vs non-living', description: 'Classify things as living or non-living', resources: [
    { type: 'url', title: 'ABC Mouse - Living Things', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Life Science', title: 'Plant parts', description: 'Identify roots, stem, leaves, flower', resources: [
    { type: 'url', title: 'ABC Mouse - Plant Parts', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Life Science', title: 'Plant life cycle', description: 'Describe seed to plant life cycle', resources: [
    { type: 'url', title: 'ABC Mouse - Plant Life Cycle', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Life Science', title: 'Animal habitats', description: 'Match animals to their habitats', resources: [
    { type: 'url', title: 'ABC Mouse - Animal Habitats', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Life Science', title: 'Basic needs of living things', description: 'Identify food, water, air, shelter as needs', resources: [
    { type: 'url', title: 'ABC Mouse - Basic Needs', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Physical Science', title: 'States of matter', description: 'Identify solid, liquid, gas', resources: [
    { type: 'url', title: 'ABC Mouse - States of Matter', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Physical Science', title: 'Properties of objects', description: 'Describe objects by color, shape, size, texture', resources: [
    { type: 'url', title: 'ABC Mouse - Object Properties', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Earth Science', title: 'Day and night', description: 'Explain why we have day and night', resources: [
    { type: 'url', title: 'ABC Mouse - Day and Night', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'science', category: 'Earth Science', title: 'Weather patterns', description: 'Observe and record daily weather', resources: [
    { type: 'url', title: 'ABC Mouse - Weather', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Social Studies
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Geography', title: 'Read simple maps', description: 'Use a simple map to find locations', resources: [
    { type: 'url', title: 'ABC Mouse - Maps & Geography', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Geography', title: 'Identify continents', description: 'Name and locate 7 continents on a map', resources: [
    { type: 'url', title: 'ABC Mouse - Continents', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Geography', title: 'Identify oceans', description: 'Name major oceans', resources: [
    { type: 'url', title: 'ABC Mouse - Oceans', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Civics', title: 'American symbols', description: 'Identify flag, Statue of Liberty, bald eagle', resources: [
    { type: 'url', title: 'ABC Mouse - American Symbols', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Civics', title: 'National holidays', description: 'Know major US holidays and their meaning', resources: [
    { type: 'url', title: 'ABC Mouse - Holidays', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'History', title: 'Past vs present', description: 'Compare life in the past to present', resources: [
    { type: 'url', title: 'ABC Mouse - Then and Now', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'History', title: 'Historical figures', description: 'Know about Washington, Lincoln, MLK Jr.', resources: [
    { type: 'url', title: 'ABC Mouse - Famous Americans', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Economics', title: 'Needs vs wants', description: 'Distinguish between needs and wants', resources: [
    { type: 'url', title: 'ABC Mouse - Needs & Wants', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'social-studies', category: 'Economics', title: 'Jobs in community', description: 'Identify various jobs and their purposes', resources: [
    { type: 'url', title: 'ABC Mouse - Community Jobs', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Life Skills
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Self-Care', title: 'Tie shoes', description: 'Tie shoelaces independently', resources: [
    { type: 'url', title: 'ABC Mouse - Life Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Self-Care', title: 'Brush teeth properly', description: 'Brush teeth for 2 minutes, all surfaces', resources: [
    { type: 'url', title: 'ABC Mouse - Dental Health', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Self-Care', title: 'Get dressed independently', description: 'Choose and put on appropriate clothing', resources: [
    { type: 'url', title: 'ABC Mouse - Self-Care', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Identify emotions in others', description: 'Recognize emotions from facial expressions', resources: [
    { type: 'url', title: 'ABC Mouse - Emotions', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Use calming strategies', description: 'Use deep breaths or counting when upset', resources: [
    { type: 'url', title: 'Cosmic Kids Yoga - Calm Down', url: 'https://www.cosmickids.com/' },
    { type: 'url', title: 'GoNoodle - Mindfulness', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Resolve conflicts', description: 'Use words to solve problems with peers', resources: [
    { type: 'url', title: 'ABC Mouse - Social Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Responsibility', title: 'Complete tasks independently', description: 'Finish assignments without constant reminders', resources: [
    { type: 'url', title: 'ABC Mouse - Responsibility', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Responsibility', title: 'Care for belongings', description: 'Keep track of and care for personal items', resources: [
    { type: 'url', title: 'ABC Mouse - Life Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Safety', title: 'Know phone number', description: 'Memorize home or parent phone number', resources: [
    { type: 'url', title: 'ABC Mouse - Safety', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'life-skills', category: 'Safety', title: 'Know full address', description: 'State complete home address', resources: [
    { type: 'url', title: 'ABC Mouse - Personal Information', url: 'https://www.abcmouse.com/' }
  ]},

  // 1st Grade Physical Education
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Skip', description: 'Skip with coordinated arm and leg movement', resources: [
    { type: 'url', title: 'GoNoodle - Movement Videos', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Gallop', description: 'Gallop leading with either foot', resources: [
    { type: 'url', title: 'GoNoodle - Galloping Activities', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Gross Motor', title: 'Jump rope', description: 'Jump rope multiple times consecutively', resources: [
    { type: 'url', title: 'GoNoodle - Jump Rope Songs', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Catch with hands', description: 'Catch a ball with hands only (not trapping)', resources: [
    { type: 'url', title: 'GoNoodle - Ball Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Throw overhand', description: 'Throw a ball overhand with accuracy', resources: [
    { type: 'url', title: 'GoNoodle - Throwing Games', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Kick a moving ball', description: 'Kick a rolling ball with control', resources: [
    { type: 'url', title: 'GoNoodle - Soccer Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Ball Skills', title: 'Bounce and catch', description: 'Bounce a ball and catch it repeatedly', resources: [
    { type: 'url', title: 'GoNoodle - Ball Activities', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'physical-ed', category: 'Fitness', title: 'Basic exercises', description: 'Perform jumping jacks, sit-ups, push-ups', resources: [
    { type: 'url', title: 'GoNoodle - Fitness Videos', url: 'https://www.gonoodle.com/' },
    { type: 'url', title: 'Cosmic Kids Yoga', url: 'https://www.cosmickids.com/' }
  ]},

  // 1st Grade Art & Music
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Art', title: 'Cut complex shapes', description: 'Cut out curved and complex shapes', resources: [
    { type: 'url', title: 'ABC Mouse - Art Projects', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Art', title: 'Mix colors', description: 'Mix primary colors to create secondary colors', resources: [
    { type: 'url', title: 'ABC Mouse - Color Mixing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Art', title: 'Draw with detail', description: 'Add details to drawings (background, features)', resources: [
    { type: 'url', title: 'ABC Mouse - Drawing Lessons', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Art', title: 'Use various media', description: 'Work with paint, markers, crayons, collage', resources: [
    { type: 'url', title: 'ABC Mouse - Art Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Music', title: 'Sing in tune', description: 'Match pitch when singing simple songs', resources: [
    { type: 'url', title: 'ABC Mouse - Singing Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Music', title: 'Identify instruments', description: 'Recognize common instruments by sight/sound', resources: [
    { type: 'url', title: 'ABC Mouse - Musical Instruments', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Music', title: 'Follow rhythm patterns', description: 'Echo and create simple rhythm patterns', resources: [
    { type: 'url', title: 'ABC Mouse - Rhythm Activities', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '1st', subjectId: 'art-music', category: 'Music', title: 'High vs low pitch', description: 'Distinguish between high and low sounds', resources: [
    { type: 'url', title: 'ABC Mouse - Pitch Practice', url: 'https://www.abcmouse.com/' }
  ]},

  // ============================================
  // 2ND GRADE MILESTONES
  // ============================================

  // 2nd Grade Mathematics
  { gradeLevel: '2nd', subjectId: 'math', category: 'Addition', title: 'Add within 100', description: 'Add two-digit numbers with and without regrouping', resources: [
    { type: 'url', title: 'Mathseeds - Addition to 100', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - 2nd Grade Math', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Addition', title: 'Add three numbers', description: 'Add three single-digit numbers', resources: [
    { type: 'url', title: 'Mathseeds - Adding Multiple Numbers', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Subtraction', title: 'Subtract within 100', description: 'Subtract two-digit numbers with regrouping', resources: [
    { type: 'url', title: 'Mathseeds - Subtraction with Regrouping', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Subtraction', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Subtraction', title: 'Fact families', description: 'Understand relationship between addition and subtraction', resources: [
    { type: 'url', title: 'Mathseeds - Fact Families', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Place Value', title: 'Understand hundreds', description: 'Read and write numbers to 1000', resources: [
    { type: 'url', title: 'Mathseeds - Place Value to 1000', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Hundreds Place', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Place Value', title: 'Compare three-digit numbers', description: 'Compare numbers to 1000 using >, <, =', resources: [
    { type: 'url', title: 'Mathseeds - Comparing Large Numbers', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Multiplication', title: 'Understand equal groups', description: 'Model multiplication as equal groups', resources: [
    { type: 'url', title: 'Mathseeds - Introduction to Multiplication', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Multiplication', title: 'Skip count by 2, 5, 10', description: 'Fluently skip count as foundation for multiplication', resources: [
    { type: 'url', title: 'Mathseeds - Skip Counting', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Skip Counting Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Time', title: 'Tell time to 5 minutes', description: 'Read analog clock to nearest 5 minutes', resources: [
    { type: 'url', title: 'Mathseeds - Telling Time', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Clock Practice', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Time', title: 'AM and PM', description: 'Understand and use AM and PM correctly', resources: [
    { type: 'url', title: 'Mathseeds - AM and PM', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Money', title: 'Identify coins', description: 'Identify penny, nickel, dime, quarter and values', resources: [
    { type: 'url', title: 'Mathseeds - Money: Coins', url: 'https://mathseeds.com/' },
    { type: 'url', title: 'ABC Mouse - Money Games', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Money', title: 'Count coins', description: 'Count mixed coins to find total value', resources: [
    { type: 'url', title: 'Mathseeds - Counting Coins', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Money', title: 'Count dollar bills', description: 'Count combinations of bills', resources: [
    { type: 'url', title: 'Mathseeds - Counting Money', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Measurement', title: 'Measure in inches', description: 'Measure length using a ruler in inches', resources: [
    { type: 'url', title: 'Mathseeds - Measurement', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Measurement', title: 'Measure in centimeters', description: 'Measure length using a ruler in centimeters', resources: [
    { type: 'url', title: 'Mathseeds - Metric Measurement', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Geometry', title: 'Identify angles', description: 'Recognize right angles in shapes', resources: [
    { type: 'url', title: 'Mathseeds - Angles', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Data', title: 'Read bar graphs', description: 'Read and interpret simple bar graphs', resources: [
    { type: 'url', title: 'Mathseeds - Reading Graphs', url: 'https://mathseeds.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'math', category: 'Data', title: 'Create bar graphs', description: 'Collect data and create bar graphs', resources: [
    { type: 'url', title: 'Mathseeds - Creating Graphs', url: 'https://mathseeds.com/' }
  ]},

  // 2nd Grade Reading
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Phonics', title: 'Read vowel teams', description: 'Decode words with vowel teams (ea, oa, ai, etc.)', resources: [
    { type: 'url', title: 'Reading Eggs - Vowel Teams', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'Reading Eggspress - Advanced Phonics', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Phonics', title: 'Read r-controlled vowels', description: 'Decode words with ar, er, ir, or, ur', resources: [
    { type: 'url', title: 'Reading Eggs - R-Controlled Vowels', url: 'https://readingeggs.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Phonics', title: 'Read multisyllabic words', description: 'Break apart and read two-syllable words', resources: [
    { type: 'url', title: 'Reading Eggs - Syllables', url: 'https://readingeggs.com/' },
    { type: 'url', title: 'Reading Eggspress - Word Building', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Fluency', title: 'Read 60+ WPM', description: 'Read grade-level text at 60+ words per minute', resources: [
    { type: 'url', title: 'Reading Eggspress - Fluency Practice', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Fluency', title: 'Read with prosody', description: 'Read with appropriate phrasing and expression', resources: [
    { type: 'url', title: 'Reading Eggspress - Expressive Reading', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Fluency', title: 'Self-correct errors', description: 'Notice and fix mistakes while reading', resources: [
    { type: 'url', title: 'Reading Eggspress - Reading Strategies', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Vocabulary', title: 'Context clues', description: 'Use context to determine word meanings', resources: [
    { type: 'url', title: 'Reading Eggspress - Vocabulary', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Vocabulary', title: 'Prefixes and suffixes', description: 'Understand common prefixes (un-, re-) and suffixes (-ed, -ing)', resources: [
    { type: 'url', title: 'Reading Eggspress - Word Parts', url: 'https://readingeggspress.com/' },
    { type: 'url', title: 'Reading Eggs - Prefixes & Suffixes', url: 'https://readingeggs.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Comprehension', title: 'Compare and contrast', description: 'Compare and contrast characters, settings, events', resources: [
    { type: 'url', title: 'Reading Eggspress - Compare & Contrast', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Comprehension', title: 'Cause and effect', description: 'Identify cause and effect relationships', resources: [
    { type: 'url', title: 'Reading Eggspress - Cause & Effect', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Comprehension', title: 'Summarize text', description: 'Summarize main ideas in own words', resources: [
    { type: 'url', title: 'Reading Eggspress - Summarizing', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Comprehension', title: 'Make inferences', description: 'Draw conclusions from text clues', resources: [
    { type: 'url', title: 'Reading Eggspress - Making Inferences', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'reading', category: 'Comprehension', title: 'Read chapter books', description: 'Read and understand simple chapter books', resources: [
    { type: 'url', title: 'Reading Eggspress - Chapter Books', url: 'https://readingeggspress.com/' }
  ]},

  // 2nd Grade Writing
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Handwriting', title: 'Legible cursive lowercase', description: 'Write lowercase cursive letters legibly', resources: [
    { type: 'url', title: 'ABC Mouse - Cursive Lowercase', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Handwriting', title: 'Legible cursive uppercase', description: 'Write uppercase cursive letters legibly', resources: [
    { type: 'url', title: 'ABC Mouse - Cursive Uppercase', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Handwriting', title: 'Connect cursive letters', description: 'Connect letters in cursive words', resources: [
    { type: 'url', title: 'ABC Mouse - Cursive Words', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Grammar', title: 'Use nouns and verbs', description: 'Use nouns and verbs correctly in sentences', resources: [
    { type: 'url', title: 'Reading Eggspress - Grammar: Nouns & Verbs', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Grammar', title: 'Use adjectives', description: 'Add adjectives to describe nouns', resources: [
    { type: 'url', title: 'Reading Eggspress - Grammar: Adjectives', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Grammar', title: 'Subject-verb agreement', description: 'Match subjects with correct verb forms', resources: [
    { type: 'url', title: 'Reading Eggspress - Grammar Skills', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Grammar', title: 'Use contractions', description: 'Write and use common contractions', resources: [
    { type: 'url', title: 'Reading Eggspress - Contractions', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Punctuation', title: 'Use commas in lists', description: 'Use commas to separate items in a series', resources: [
    { type: 'url', title: 'Reading Eggspress - Punctuation', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Punctuation', title: 'Use apostrophes', description: 'Use apostrophes for contractions and possessives', resources: [
    { type: 'url', title: 'Reading Eggspress - Apostrophes', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Composition', title: 'Write paragraphs', description: 'Write paragraphs with topic sentence and details', resources: [
    { type: 'url', title: 'Reading Eggspress - Paragraph Writing', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Composition', title: 'Write narratives', description: 'Write stories with beginning, middle, end', resources: [
    { type: 'url', title: 'Reading Eggspress - Narrative Writing', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Composition', title: 'Write informative text', description: 'Write to inform with facts and details', resources: [
    { type: 'url', title: 'Reading Eggspress - Informative Writing', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Composition', title: 'Write opinion pieces', description: 'Write opinions with supporting reasons', resources: [
    { type: 'url', title: 'Reading Eggspress - Opinion Writing', url: 'https://readingeggspress.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'writing', category: 'Process', title: 'Edit and revise', description: 'Review and improve own writing', resources: [
    { type: 'url', title: 'Reading Eggspress - Editing Skills', url: 'https://readingeggspress.com/' }
  ]},

  // 2nd Grade Science
  { gradeLevel: '2nd', subjectId: 'science', category: 'Life Science', title: 'Animal life cycles', description: 'Describe life cycles of various animals', resources: [
    { type: 'url', title: 'ABC Mouse - Animal Life Cycles', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Life Science', title: 'Insect characteristics', description: 'Identify characteristics of insects', resources: [
    { type: 'url', title: 'ABC Mouse - Insects', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Life Science', title: 'Food chains', description: 'Understand simple food chains', resources: [
    { type: 'url', title: 'ABC Mouse - Food Chains', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Life Science', title: 'Seed dispersal', description: 'Explain how seeds travel and spread', resources: [
    { type: 'url', title: 'ABC Mouse - Seeds & Plants', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Physical Science', title: 'Properties of matter', description: 'Describe matter by multiple properties', resources: [
    { type: 'url', title: 'ABC Mouse - Matter', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Physical Science', title: 'Changes in matter', description: 'Observe physical changes (melting, freezing)', resources: [
    { type: 'url', title: 'ABC Mouse - Changes in Matter', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Physical Science', title: 'Magnets', description: 'Explore magnetic attraction and repulsion', resources: [
    { type: 'url', title: 'ABC Mouse - Magnets', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Earth Science', title: 'Earth materials', description: 'Identify rocks, soil, and water', resources: [
    { type: 'url', title: 'ABC Mouse - Earth Materials', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Earth Science', title: 'Erosion and weathering', description: 'Understand how earth changes over time', resources: [
    { type: 'url', title: 'ABC Mouse - Erosion', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'science', category: 'Earth Science', title: 'Water cycle', description: 'Describe the water cycle stages', resources: [
    { type: 'url', title: 'ABC Mouse - Water Cycle', url: 'https://www.abcmouse.com/' }
  ]},

  // 2nd Grade Social Studies
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Geography', title: 'Use map key/legend', description: 'Interpret symbols on a map using the key', resources: [
    { type: 'url', title: 'ABC Mouse - Map Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Geography', title: 'Cardinal directions', description: 'Use N, S, E, W on maps', resources: [
    { type: 'url', title: 'ABC Mouse - Directions', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Geography', title: 'Landforms and water', description: 'Identify mountains, rivers, lakes, oceans', resources: [
    { type: 'url', title: 'ABC Mouse - Landforms', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Geography', title: 'US states', description: 'Identify home state and neighboring states', resources: [
    { type: 'url', title: 'ABC Mouse - US States', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'History', title: 'Native Americans', description: 'Learn about Native American cultures', resources: [
    { type: 'url', title: 'ABC Mouse - Native Americans', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'History', title: 'Early settlers', description: 'Learn about Pilgrims and early colonies', resources: [
    { type: 'url', title: 'ABC Mouse - Early America', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'History', title: 'American heroes', description: 'Learn about historical American heroes', resources: [
    { type: 'url', title: 'ABC Mouse - American Heroes', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Civics', title: 'Government basics', description: 'Understand president, laws, voting', resources: [
    { type: 'url', title: 'ABC Mouse - Government', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Civics', title: 'Rights and responsibilities', description: 'Understand citizen rights and duties', resources: [
    { type: 'url', title: 'ABC Mouse - Citizenship', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Economics', title: 'Goods and services', description: 'Distinguish between goods and services', resources: [
    { type: 'url', title: 'ABC Mouse - Economics', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'social-studies', category: 'Economics', title: 'Producers and consumers', description: 'Understand producers and consumers', resources: [
    { type: 'url', title: 'ABC Mouse - Producers & Consumers', url: 'https://www.abcmouse.com/' }
  ]},

  // 2nd Grade Life Skills
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Self-Care', title: 'Personal hygiene routine', description: 'Complete morning and bedtime hygiene independently', resources: [
    { type: 'url', title: 'ABC Mouse - Health & Hygiene', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Self-Care', title: 'Pack own bag', description: 'Prepare needed items for school or outings', resources: [
    { type: 'url', title: 'ABC Mouse - Organization Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Empathy', description: 'Show understanding of others\' feelings', resources: [
    { type: 'url', title: 'ABC Mouse - Social-Emotional Learning', url: 'https://www.abcmouse.com/' },
    { type: 'url', title: 'GoNoodle - Empathy Videos', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Handle disappointment', description: 'Cope appropriately when things don\'t go as planned', resources: [
    { type: 'url', title: 'Cosmic Kids Yoga - Emotional Regulation', url: 'https://www.cosmickids.com/' },
    { type: 'url', title: 'GoNoodle - Mindfulness', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Social-Emotional', title: 'Make friends', description: 'Initiate and maintain friendships', resources: [
    { type: 'url', title: 'ABC Mouse - Friendship Skills', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Responsibility', title: 'Manage time', description: 'Complete tasks within time limits', resources: [
    { type: 'url', title: 'ABC Mouse - Time Management', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Responsibility', title: 'Simple chores', description: 'Complete age-appropriate household chores', resources: [
    { type: 'url', title: 'ABC Mouse - Responsibility', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Safety', title: 'Internet safety basics', description: 'Understand basic online safety rules', resources: [
    { type: 'url', title: 'ABC Mouse - Internet Safety', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'life-skills', category: 'Safety', title: 'Emergency procedures', description: 'Know what to do in emergencies', resources: [
    { type: 'url', title: 'ABC Mouse - Safety', url: 'https://www.abcmouse.com/' }
  ]},

  // 2nd Grade Physical Education
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Sports Skills', title: 'Dribble a ball', description: 'Dribble a basketball while moving', resources: [
    { type: 'url', title: 'GoNoodle - Basketball Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Sports Skills', title: 'Bat a ball', description: 'Hit a ball off a tee or pitched underhand', resources: [
    { type: 'url', title: 'GoNoodle - Batting Practice', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Sports Skills', title: 'Soccer basics', description: 'Dribble and pass a soccer ball', resources: [
    { type: 'url', title: 'GoNoodle - Soccer Skills', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Fitness', title: 'Sustained activity', description: 'Participate in 20+ minutes of activity', resources: [
    { type: 'url', title: 'GoNoodle - Cardio Workouts', url: 'https://www.gonoodle.com/' },
    { type: 'url', title: 'Cosmic Kids Yoga', url: 'https://www.cosmickids.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Fitness', title: 'Flexibility exercises', description: 'Perform stretching routines', resources: [
    { type: 'url', title: 'Cosmic Kids Yoga - Stretching', url: 'https://www.cosmickids.com/' },
    { type: 'url', title: 'GoNoodle - Stretching Videos', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Coordination', title: 'Ride a bike', description: 'Ride a two-wheel bike independently', resources: [
    { type: 'url', title: 'GoNoodle - Bike Safety', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Coordination', title: 'Swim basics', description: 'Basic swimming skills and water safety', resources: [
    { type: 'url', title: 'ABC Mouse - Water Safety', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Team Sports', title: 'Follow game rules', description: 'Play team games following rules', resources: [
    { type: 'url', title: 'GoNoodle - Team Games', url: 'https://www.gonoodle.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'physical-ed', category: 'Team Sports', title: 'Good sportsmanship', description: 'Win and lose gracefully', resources: [
    { type: 'url', title: 'ABC Mouse - Sportsmanship', url: 'https://www.abcmouse.com/' },
    { type: 'url', title: 'GoNoodle - Good Sport Videos', url: 'https://www.gonoodle.com/' }
  ]},

  // 2nd Grade Art & Music
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Art', title: 'Create perspective', description: 'Show foreground and background in drawings', resources: [
    { type: 'url', title: 'ABC Mouse - Art: Perspective', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Art', title: 'Use shading', description: 'Add shading to create dimension', resources: [
    { type: 'url', title: 'ABC Mouse - Shading Techniques', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Art', title: 'Art appreciation', description: 'Discuss famous artworks and artists' },
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Art', title: 'Craft projects', description: 'Complete multi-step craft projects', resources: [
    { type: 'url', title: 'ABC Mouse - Craft Projects', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Music', title: 'Read basic notation', description: 'Identify quarter notes, half notes, rests', resources: [
    { type: 'url', title: 'ABC Mouse - Music Notation', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Music', title: 'Play simple instrument', description: 'Play basic songs on recorder or xylophone' },
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Music', title: 'Sing with group', description: 'Sing in a group staying in tune and rhythm', resources: [
    { type: 'url', title: 'ABC Mouse - Singing', url: 'https://www.abcmouse.com/' }
  ]},
  { gradeLevel: '2nd', subjectId: 'art-music', category: 'Music', title: 'Music appreciation', description: 'Identify different music genres', resources: [
    { type: 'url', title: 'ABC Mouse - Music Genres', url: 'https://www.abcmouse.com/' }
  ]},

  // ============================================
  // KINDERGARTEN MILESTONES
  // ============================================

  // Kindergarten Mathematics
  { gradeLevel: 'k', subjectId: 'math', category: 'Counting', title: 'Count to 100', description: 'Count to 100 by ones and by tens' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Counting', title: 'Count objects to 20', description: 'Count up to 20 objects with one-to-one correspondence' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Counting', title: 'Count forward from any number', description: 'Count forward beginning from a given number within 100' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Numbers', title: 'Write numbers 0-20', description: 'Write numerals 0 through 20 legibly' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Numbers', title: 'Represent quantities', description: 'Represent a number of objects with a written numeral 0-20' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Comparison', title: 'Compare numbers to 10', description: 'Identify whether groups are greater than, less than, or equal' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Comparison', title: 'Compare written numerals', description: 'Compare two numbers between 1 and 10 presented as written numerals' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Operations', title: 'Addition within 5', description: 'Fluently add within 5' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Operations', title: 'Subtraction within 5', description: 'Fluently subtract within 5' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Operations', title: 'Addition within 10', description: 'Solve addition word problems within 10' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Operations', title: 'Subtraction within 10', description: 'Solve subtraction word problems within 10' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Operations', title: 'Decompose numbers to 10', description: 'Decompose numbers less than or equal to 10 into pairs' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Geometry', title: 'Identify 2D shapes', description: 'Identify circles, triangles, squares, rectangles, and hexagons' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Geometry', title: 'Identify 3D shapes', description: 'Identify cubes, cones, cylinders, and spheres' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Geometry', title: 'Describe shapes', description: 'Describe objects using names of shapes and positions' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Measurement', title: 'Compare lengths', description: 'Directly compare two objects with a measurable attribute' },
  { gradeLevel: 'k', subjectId: 'math', category: 'Measurement', title: 'Classify objects', description: 'Classify objects into given categories and count' },

  // Kindergarten Reading
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonics', title: 'All letter sounds', description: 'Produce the primary sound for each consonant and vowel' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonics', title: 'CVC words', description: 'Read common consonant-vowel-consonant words' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonics', title: 'Blend sounds', description: 'Blend two to three phonemes into recognizable words' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonics', title: 'Segment words', description: 'Segment simple words into individual sounds' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonemic Awareness', title: 'Rhyming words', description: 'Recognize and produce rhyming words' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Phonemic Awareness', title: 'Syllables', description: 'Count, pronounce, blend, and segment syllables' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Sight Words', title: 'Read sight words', description: 'Read common high-frequency words by sight' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Comprehension', title: 'Retell stories', description: 'Retell familiar stories with key details' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Comprehension', title: 'Ask and answer questions', description: 'Ask and answer questions about key details in a text' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Comprehension', title: 'Identify characters and settings', description: 'Identify characters, settings, and major events in a story' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Concepts of Print', title: 'Book handling', description: 'Follow words left to right, top to bottom, page by page' },
  { gradeLevel: 'k', subjectId: 'reading', category: 'Concepts of Print', title: 'Understand word spacing', description: 'Recognize that words are separated by spaces in print' },

  // Kindergarten Writing
  { gradeLevel: 'k', subjectId: 'writing', category: 'Handwriting', title: 'Write all letters', description: 'Write all uppercase and lowercase letters legibly' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Handwriting', title: 'Write first name', description: 'Write first name with correct letter formation' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Handwriting', title: 'Write last name', description: 'Write last name with correct letter formation' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Composition', title: 'Draw and write', description: 'Use drawing, dictating, and writing to compose opinion pieces' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Composition', title: 'Write about events', description: 'Use drawing, dictating, and writing to narrate events' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Composition', title: 'Informative writing', description: 'Use drawing, dictating, and writing to compose informative texts' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Conventions', title: 'Capitalize first word', description: 'Capitalize the first word in a sentence' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Conventions', title: 'End punctuation', description: 'Recognize and use end punctuation' },
  { gradeLevel: 'k', subjectId: 'writing', category: 'Spelling', title: 'Spell simple words', description: 'Spell simple words phonetically' },

  // Kindergarten Science
  { gradeLevel: 'k', subjectId: 'science', category: 'Life Science', title: 'Living vs non-living', description: 'Distinguish between living and non-living things' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Life Science', title: 'Basic needs of plants', description: 'Identify what plants need to live and grow' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Life Science', title: 'Basic needs of animals', description: 'Identify what animals need to survive' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Earth Science', title: 'Weather observation', description: 'Observe and describe daily weather conditions' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Earth Science', title: 'Seasons', description: 'Describe the four seasons and their characteristics' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Physical Science', title: 'Push and pull', description: 'Understand that pushes and pulls can change motion' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Physical Science', title: 'Properties of materials', description: 'Describe objects by observable properties' },
  { gradeLevel: 'k', subjectId: 'science', category: 'Scientific Inquiry', title: 'Make observations', description: 'Use senses to gather information about objects' },

  // Kindergarten Social Studies
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Citizenship', title: 'Classroom rules', description: 'Understand the purpose of rules in the classroom' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Citizenship', title: 'Community helpers', description: 'Identify community helpers and their roles' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Geography', title: 'Maps and globes', description: 'Recognize that maps and globes represent places' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Geography', title: 'Land and water', description: 'Identify basic landforms and bodies of water' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'History', title: 'Personal timeline', description: 'Sequence events in personal history' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'History', title: 'National holidays', description: 'Recognize major national holidays and their significance' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Economics', title: 'Needs vs wants', description: 'Distinguish between needs and wants' },
  { gradeLevel: 'k', subjectId: 'social-studies', category: 'Culture', title: 'Family traditions', description: 'Describe family customs and traditions' },

  // Kindergarten Life Skills
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Self-Care', title: 'Tie shoes', description: 'Independently tie shoelaces' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Self-Care', title: 'Button and zip', description: 'Button shirts and zip jackets independently' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Self-Care', title: 'Personal hygiene', description: 'Follow basic hygiene routines independently' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Social Skills', title: 'Take turns', description: 'Practice taking turns in games and activities' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Social Skills', title: 'Share materials', description: 'Share materials and toys with others' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Safety', title: 'Know address', description: 'Know home address and phone number' },
  { gradeLevel: 'k', subjectId: 'life-skills', category: 'Safety', title: 'Stranger safety', description: 'Understand basic stranger safety rules' },

  // Kindergarten Physical Education
  { gradeLevel: 'k', subjectId: 'physical-ed', category: 'Motor Skills', title: 'Hopping and skipping', description: 'Hop on one foot and skip with coordination' },
  { gradeLevel: 'k', subjectId: 'physical-ed', category: 'Motor Skills', title: 'Catch a ball', description: 'Catch a large ball with both hands' },
  { gradeLevel: 'k', subjectId: 'physical-ed', category: 'Motor Skills', title: 'Throw overhand', description: 'Throw a ball overhand with developing accuracy' },
  { gradeLevel: 'k', subjectId: 'physical-ed', category: 'Balance', title: 'Balance on one foot', description: 'Balance on one foot for 10 seconds' },
  { gradeLevel: 'k', subjectId: 'physical-ed', category: 'Fitness', title: 'Physical activity', description: 'Engage in at least 60 minutes of physical activity daily' },

  // Kindergarten Art & Music
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Art', title: 'Use art materials', description: 'Use crayons, markers, paint, and scissors appropriately' },
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Art', title: 'Create artwork', description: 'Create artwork using various materials and techniques' },
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Art', title: 'Identify colors', description: 'Identify and name primary and secondary colors' },
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Music', title: 'Sing simple songs', description: 'Sing age-appropriate songs from memory' },
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Music', title: 'Keep a beat', description: 'Clap or move to a steady beat' },
  { gradeLevel: 'k', subjectId: 'art-music', category: 'Music', title: 'Fast and slow', description: 'Distinguish between fast and slow tempos' },

  // ============================================
  // 3RD GRADE MILESTONES
  // ============================================

  // 3rd Grade Mathematics
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Multiplication facts to 10', description: 'Know multiplication facts up to 10 × 10 from memory' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Division facts to 10', description: 'Know division facts related to multiplication facts' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Multi-digit addition', description: 'Add multi-digit numbers using strategies and algorithms' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Multi-digit subtraction', description: 'Subtract multi-digit numbers using strategies and algorithms' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Multiply by multiples of 10', description: 'Multiply one-digit numbers by multiples of 10' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Operations', title: 'Two-step word problems', description: 'Solve two-step word problems using four operations' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Fractions', title: 'Understand fractions', description: 'Understand fractions as parts of a whole' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Fractions', title: 'Fractions on number line', description: 'Represent fractions on a number line' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Fractions', title: 'Equivalent fractions', description: 'Recognize and generate simple equivalent fractions' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Fractions', title: 'Compare fractions', description: 'Compare two fractions with same numerator or denominator' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Measurement', title: 'Tell time to minute', description: 'Tell and write time to the nearest minute' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Measurement', title: 'Elapsed time', description: 'Solve problems involving elapsed time' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Measurement', title: 'Liquid volume', description: 'Measure and estimate liquid volumes in liters' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Measurement', title: 'Mass', description: 'Measure and estimate masses in grams and kilograms' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Geometry', title: 'Understand area', description: 'Understand area as covering with unit squares' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Geometry', title: 'Calculate area', description: 'Find area by multiplying side lengths' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Geometry', title: 'Perimeter', description: 'Solve problems involving perimeters of polygons' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Data', title: 'Picture graphs', description: 'Draw and interpret scaled picture graphs' },
  { gradeLevel: '3rd', subjectId: 'math', category: 'Data', title: 'Bar graphs', description: 'Draw and interpret scaled bar graphs' },

  // 3rd Grade Reading
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Fluency', title: 'Read fluently', description: 'Read grade-level text with accuracy and fluency' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Comprehension', title: 'Main idea and details', description: 'Determine the main idea and supporting details of a text' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Comprehension', title: 'Ask and answer questions', description: 'Ask and answer questions referring to the text' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Comprehension', title: 'Sequence events', description: 'Describe the sequence of events in a story' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Comprehension', title: 'Character traits', description: 'Describe characters and explain their actions' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Comprehension', title: 'Central message', description: 'Determine the central message, lesson, or moral' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Vocabulary', title: 'Context clues', description: 'Use context clues to determine word meanings' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Vocabulary', title: 'Root words and affixes', description: 'Use root words and affixes to understand word meanings' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Literary Elements', title: 'Point of view', description: 'Distinguish own point of view from narrator or characters' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Literary Elements', title: 'Compare texts', description: 'Compare and contrast themes, settings, and plots' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Informational Text', title: 'Text features', description: 'Use text features to locate information' },
  { gradeLevel: '3rd', subjectId: 'reading', category: 'Informational Text', title: 'Compare texts', description: 'Compare and contrast two texts on the same topic' },

  // 3rd Grade Writing
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Narrative', title: 'Write narratives', description: 'Write narratives with a clear sequence of events' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Narrative', title: 'Use dialogue', description: 'Use dialogue and descriptions in narratives' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Opinion', title: 'Opinion writing', description: 'Write opinion pieces with reasons and supporting details' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Informative', title: 'Informative writing', description: 'Write informative texts that examine a topic' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Process', title: 'Plan and revise', description: 'Plan, revise, and edit writing with guidance' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Process', title: 'Use technology', description: 'Use technology to produce and publish writing' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Research', title: 'Short research projects', description: 'Conduct short research projects using multiple sources' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Grammar', title: 'Parts of speech', description: 'Identify and use nouns, verbs, adjectives, and adverbs' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Grammar', title: 'Subject-verb agreement', description: 'Ensure subject-verb agreement in sentences' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Grammar', title: 'Verb tenses', description: 'Form and use regular and irregular verb tenses' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Conventions', title: 'Capitalization', description: 'Use correct capitalization in writing' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Conventions', title: 'Punctuation', description: 'Use commas and quotation marks appropriately' },
  { gradeLevel: '3rd', subjectId: 'writing', category: 'Handwriting', title: 'Cursive writing', description: 'Write legibly in cursive' },

  // 3rd Grade Science
  { gradeLevel: '3rd', subjectId: 'science', category: 'Life Science', title: 'Life cycles', description: 'Describe life cycles of plants and animals' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Life Science', title: 'Inherited traits', description: 'Understand that traits are inherited from parents' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Life Science', title: 'Ecosystems', description: 'Understand how organisms interact in ecosystems' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Earth Science', title: 'Weather and climate', description: 'Distinguish between weather and climate' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Earth Science', title: 'Natural hazards', description: 'Understand natural hazards and how to prepare' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Physical Science', title: 'Forces and motion', description: 'Investigate the effects of balanced and unbalanced forces' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Physical Science', title: 'Magnets', description: 'Investigate magnetic interactions' },
  { gradeLevel: '3rd', subjectId: 'science', category: 'Scientific Method', title: 'Plan investigations', description: 'Plan and conduct investigations to answer questions' },

  // 3rd Grade Social Studies
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Geography', title: 'Read maps', description: 'Use map skills including scale, compass rose, and key' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Geography', title: 'Physical features', description: 'Identify major physical features of the United States' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'History', title: 'Local history', description: 'Learn about the history of local community' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'History', title: 'Primary sources', description: 'Use primary sources to learn about the past' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Civics', title: 'Government structure', description: 'Understand basic structure of local government' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Civics', title: 'Rights and responsibilities', description: 'Understand rights and responsibilities of citizens' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Economics', title: 'Producers and consumers', description: 'Understand the relationship between producers and consumers' },
  { gradeLevel: '3rd', subjectId: 'social-studies', category: 'Economics', title: 'Resources', description: 'Identify natural, human, and capital resources' },

  // 3rd Grade Life Skills
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Organization', title: 'Manage materials', description: 'Organize school materials and assignments' },
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Organization', title: 'Time management', description: 'Use schedules and planners to manage time' },
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Social Skills', title: 'Conflict resolution', description: 'Use strategies to resolve conflicts peacefully' },
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Social Skills', title: 'Cooperation', description: 'Work cooperatively in groups' },
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Keyboard basics', description: 'Use proper keyboarding technique' },
  { gradeLevel: '3rd', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Internet safety', description: 'Practice safe internet use' },

  // 3rd Grade Physical Education
  { gradeLevel: '3rd', subjectId: 'physical-ed', category: 'Skills', title: 'Throwing and catching', description: 'Throw and catch with accuracy and control' },
  { gradeLevel: '3rd', subjectId: 'physical-ed', category: 'Skills', title: 'Kicking', description: 'Kick a ball with control and accuracy' },
  { gradeLevel: '3rd', subjectId: 'physical-ed', category: 'Fitness', title: 'Cardiovascular endurance', description: 'Participate in activities that build cardiovascular endurance' },
  { gradeLevel: '3rd', subjectId: 'physical-ed', category: 'Fitness', title: 'Flexibility', description: 'Demonstrate flexibility through stretching exercises' },
  { gradeLevel: '3rd', subjectId: 'physical-ed', category: 'Games', title: 'Team sports', description: 'Participate in modified team sports with basic rules' },

  // 3rd Grade Art & Music
  { gradeLevel: '3rd', subjectId: 'art-music', category: 'Art', title: 'Art elements', description: 'Identify and use line, shape, color, texture, and space' },
  { gradeLevel: '3rd', subjectId: 'art-music', category: 'Art', title: 'Art techniques', description: 'Use various techniques in drawing and painting' },
  { gradeLevel: '3rd', subjectId: 'art-music', category: 'Music', title: 'Read music notation', description: 'Read and perform simple musical notation' },
  { gradeLevel: '3rd', subjectId: 'art-music', category: 'Music', title: 'Play recorder', description: 'Play simple songs on the recorder' },
  { gradeLevel: '3rd', subjectId: 'art-music', category: 'Music', title: 'Music history', description: 'Learn about composers and music from different periods' },

  // ============================================
  // 4TH GRADE MILESTONES
  // ============================================

  // 4th Grade Mathematics
  { gradeLevel: '4th', subjectId: 'math', category: 'Operations', title: 'Multi-digit multiplication', description: 'Multiply multi-digit numbers using standard algorithm' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Operations', title: 'Multi-digit division', description: 'Divide multi-digit numbers by one-digit divisors' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Operations', title: 'Factor pairs', description: 'Find factor pairs for whole numbers 1-100' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Operations', title: 'Prime and composite', description: 'Determine whether numbers are prime or composite' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Place Value', title: 'Place value to millions', description: 'Understand place value to the millions place' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Place Value', title: 'Compare large numbers', description: 'Compare multi-digit numbers using symbols' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Place Value', title: 'Round numbers', description: 'Round multi-digit whole numbers to any place' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Fractions', title: 'Equivalent fractions', description: 'Generate equivalent fractions using multiplication' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Fractions', title: 'Compare fractions', description: 'Compare fractions with different denominators' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Fractions', title: 'Add fractions', description: 'Add fractions with like denominators' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Fractions', title: 'Subtract fractions', description: 'Subtract fractions with like denominators' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Fractions', title: 'Multiply fractions', description: 'Multiply a fraction by a whole number' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Decimals', title: 'Decimal notation', description: 'Use decimal notation for fractions with denominators 10 or 100' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Decimals', title: 'Compare decimals', description: 'Compare two decimals to hundredths' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Measurement', title: 'Unit conversions', description: 'Convert between units within a measurement system' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Measurement', title: 'Area and perimeter', description: 'Apply area and perimeter formulas for rectangles' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Geometry', title: 'Angle measurement', description: 'Measure angles in degrees using a protractor' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Geometry', title: 'Classify shapes', description: 'Classify shapes by properties of their lines and angles' },
  { gradeLevel: '4th', subjectId: 'math', category: 'Geometry', title: 'Lines and angles', description: 'Identify parallel, perpendicular lines and angle types' },

  // 4th Grade Reading
  { gradeLevel: '4th', subjectId: 'reading', category: 'Comprehension', title: 'Summarize text', description: 'Summarize text accurately using key details' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Comprehension', title: 'Make inferences', description: 'Make inferences using textual evidence' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Comprehension', title: 'Theme', description: 'Determine the theme of a story or poem' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Comprehension', title: 'Compare perspectives', description: 'Compare first- and third-person narratives' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Literary Analysis', title: 'Figurative language', description: 'Identify and interpret similes and metaphors' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Literary Analysis', title: 'Story structure', description: 'Describe the overall structure of a story' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Informational Text', title: 'Explain procedures', description: 'Explain procedures or concepts in informational text' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Informational Text', title: 'Integrate information', description: 'Integrate information from two texts on same topic' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Vocabulary', title: 'Greek and Latin roots', description: 'Use Greek and Latin roots to understand words' },
  { gradeLevel: '4th', subjectId: 'reading', category: 'Vocabulary', title: 'Reference materials', description: 'Use dictionaries and glossaries to clarify meanings' },

  // 4th Grade Writing
  { gradeLevel: '4th', subjectId: 'writing', category: 'Narrative', title: 'Develop characters', description: 'Develop characters through dialogue and description' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Narrative', title: 'Narrative techniques', description: 'Use sensory details and transitional words' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Opinion', title: 'Persuasive writing', description: 'Write opinion pieces with organized reasons' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Informative', title: 'Research reports', description: 'Write informative reports with multiple paragraphs' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Process', title: 'Revise for clarity', description: 'Revise writing for clarity and organization' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Grammar', title: 'Relative pronouns', description: 'Use relative pronouns and adverbs correctly' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Grammar', title: 'Progressive tenses', description: 'Form and use progressive verb tenses' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Grammar', title: 'Prepositional phrases', description: 'Correctly use prepositional phrases' },
  { gradeLevel: '4th', subjectId: 'writing', category: 'Conventions', title: 'Commas in compound sentences', description: 'Use commas before coordinating conjunctions' },

  // 4th Grade Science
  { gradeLevel: '4th', subjectId: 'science', category: 'Life Science', title: 'Plant and animal structures', description: 'Understand how structures support survival' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Life Science', title: 'Food chains', description: 'Model food chains and food webs' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Earth Science', title: 'Earth processes', description: 'Understand weathering, erosion, and deposition' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Earth Science', title: 'Rocks and minerals', description: 'Identify properties of rocks and minerals' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Physical Science', title: 'Energy transfer', description: 'Understand how energy transfers between objects' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Physical Science', title: 'Waves', description: 'Understand properties of waves including light and sound' },
  { gradeLevel: '4th', subjectId: 'science', category: 'Engineering', title: 'Design solutions', description: 'Design solutions to problems using engineering process' },

  // 4th Grade Social Studies
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'Geography', title: 'US regions', description: 'Identify and describe the regions of the United States' },
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'Geography', title: 'State geography', description: 'Study the geography of your state' },
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'History', title: 'State history', description: 'Learn about the history of your state' },
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'History', title: 'Native Americans', description: 'Learn about Native American cultures in your region' },
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'Civics', title: 'State government', description: 'Understand the structure of state government' },
  { gradeLevel: '4th', subjectId: 'social-studies', category: 'Economics', title: 'Economic regions', description: 'Understand how geography affects economic activity' },

  // 4th Grade Life Skills
  { gradeLevel: '4th', subjectId: 'life-skills', category: 'Study Skills', title: 'Note-taking', description: 'Take organized notes from reading and lectures' },
  { gradeLevel: '4th', subjectId: 'life-skills', category: 'Study Skills', title: 'Test preparation', description: 'Use effective strategies to prepare for tests' },
  { gradeLevel: '4th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Typing proficiency', description: 'Type at least 15 words per minute accurately' },
  { gradeLevel: '4th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Online research', description: 'Conduct basic online research safely' },
  { gradeLevel: '4th', subjectId: 'life-skills', category: 'Financial Literacy', title: 'Saving and spending', description: 'Understand concepts of saving and budgeting' },

  // 4th Grade Physical Education & Arts
  { gradeLevel: '4th', subjectId: 'physical-ed', category: 'Skills', title: 'Sports skills', description: 'Demonstrate skills in various sports' },
  { gradeLevel: '4th', subjectId: 'physical-ed', category: 'Fitness', title: 'Personal fitness', description: 'Set and work toward personal fitness goals' },
  { gradeLevel: '4th', subjectId: 'art-music', category: 'Art', title: 'Art history', description: 'Learn about artists and art movements' },
  { gradeLevel: '4th', subjectId: 'art-music', category: 'Music', title: 'Instrument proficiency', description: 'Play an instrument with increasing proficiency' },

  // ============================================
  // 5TH GRADE MILESTONES
  // ============================================

  // 5th Grade Mathematics
  { gradeLevel: '5th', subjectId: 'math', category: 'Place Value', title: 'Decimals to thousandths', description: 'Understand place value to thousandths' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Place Value', title: 'Powers of 10', description: 'Understand powers of 10 and their patterns' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Operations', title: 'Multi-digit division', description: 'Divide multi-digit numbers by two-digit divisors' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Operations', title: 'Decimal operations', description: 'Add, subtract, multiply, and divide decimals' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Fractions', title: 'Add unlike fractions', description: 'Add fractions with unlike denominators' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Fractions', title: 'Subtract unlike fractions', description: 'Subtract fractions with unlike denominators' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Fractions', title: 'Multiply fractions', description: 'Multiply fractions and mixed numbers' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Fractions', title: 'Divide fractions', description: 'Divide whole numbers by unit fractions' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Measurement', title: 'Volume', description: 'Find volume of rectangular prisms' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Measurement', title: 'Unit conversions', description: 'Convert between different units of measurement' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Geometry', title: 'Coordinate plane', description: 'Graph points on a coordinate plane' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Geometry', title: 'Classify 2D shapes', description: 'Classify 2D shapes based on properties' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Algebra', title: 'Numerical expressions', description: 'Write and interpret numerical expressions' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Algebra', title: 'Order of operations', description: 'Apply order of operations correctly' },
  { gradeLevel: '5th', subjectId: 'math', category: 'Algebra', title: 'Patterns', description: 'Analyze patterns and relationships' },

  // 5th Grade Reading
  { gradeLevel: '5th', subjectId: 'reading', category: 'Comprehension', title: 'Quote from text', description: 'Quote accurately from text when explaining' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Comprehension', title: 'Determine theme', description: 'Determine theme and summarize text' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Comprehension', title: 'Compare characters', description: 'Compare and contrast characters in a story' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Literary Analysis', title: 'Analyze structure', description: 'Analyze how chapters or scenes fit together' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Literary Analysis', title: 'Point of view', description: 'Describe how point of view influences events' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Literary Analysis', title: 'Visual elements', description: 'Analyze visual and multimedia elements' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Informational Text', title: 'Multiple accounts', description: 'Analyze multiple accounts of same topic' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Informational Text', title: 'Author argument', description: 'Identify and evaluate author arguments' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Vocabulary', title: 'Figurative language', description: 'Interpret figurative language in context' },
  { gradeLevel: '5th', subjectId: 'reading', category: 'Vocabulary', title: 'Academic vocabulary', description: 'Acquire and use academic vocabulary' },

  // 5th Grade Writing
  { gradeLevel: '5th', subjectId: 'writing', category: 'Narrative', title: 'Complex narratives', description: 'Write narratives with multiple plot elements' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Opinion', title: 'Argumentative writing', description: 'Write arguments with logically organized reasons' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Informative', title: 'Research papers', description: 'Write research papers with proper citations' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Process', title: 'Writing process', description: 'Use writing process: plan, draft, revise, edit, publish' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Grammar', title: 'Perfect verb tenses', description: 'Use perfect verb tenses correctly' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Grammar', title: 'Conjunctions', description: 'Use correlative conjunctions' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Conventions', title: 'Punctuation for effect', description: 'Use punctuation to separate items in a series' },
  { gradeLevel: '5th', subjectId: 'writing', category: 'Conventions', title: 'Comma usage', description: 'Use commas correctly in complex sentences' },

  // 5th Grade Science
  { gradeLevel: '5th', subjectId: 'science', category: 'Life Science', title: 'Matter cycling', description: 'Understand how matter cycles through ecosystems' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Life Science', title: 'Photosynthesis', description: 'Understand how plants use air and water' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Earth Science', title: 'Earth systems', description: 'Understand interactions among Earth systems' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Earth Science', title: 'Water cycle', description: 'Describe the water cycle' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Earth Science', title: 'Stars and solar system', description: 'Understand patterns of stars and planets' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Physical Science', title: 'Properties of matter', description: 'Identify and measure properties of matter' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Physical Science', title: 'Chemical reactions', description: 'Understand that matter is conserved in reactions' },
  { gradeLevel: '5th', subjectId: 'science', category: 'Physical Science', title: 'Gravity', description: 'Understand gravitational force' },

  // 5th Grade Social Studies
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'History', title: 'Colonial America', description: 'Study colonial America and early settlements' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'History', title: 'American Revolution', description: 'Understand causes and events of the Revolution' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'History', title: 'Constitution', description: 'Study the creation of the Constitution' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'Civics', title: 'Federal government', description: 'Understand the three branches of government' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'Civics', title: 'Bill of Rights', description: 'Understand the Bill of Rights' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'Geography', title: 'US geography', description: 'Identify major geographic features of US' },
  { gradeLevel: '5th', subjectId: 'social-studies', category: 'Economics', title: 'Free enterprise', description: 'Understand basic economic principles' },

  // 5th Grade Life Skills & Other
  { gradeLevel: '5th', subjectId: 'life-skills', category: 'Study Skills', title: 'Research skills', description: 'Conduct independent research projects' },
  { gradeLevel: '5th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Digital citizenship', description: 'Practice responsible digital citizenship' },
  { gradeLevel: '5th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Typing speed', description: 'Type at least 20 words per minute' },
  { gradeLevel: '5th', subjectId: 'physical-ed', category: 'Fitness', title: 'Fitness assessment', description: 'Meet grade-level fitness standards' },
  { gradeLevel: '5th', subjectId: 'art-music', category: 'Art', title: 'Art portfolio', description: 'Create an art portfolio demonstrating growth' },
  { gradeLevel: '5th', subjectId: 'art-music', category: 'Music', title: 'Music performance', description: 'Perform music individually or in groups' },

  // ============================================
  // 6TH GRADE MILESTONES
  // ============================================

  // 6th Grade Mathematics
  { gradeLevel: '6th', subjectId: 'math', category: 'Ratios', title: 'Understand ratios', description: 'Understand ratio concepts and reasoning' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Ratios', title: 'Unit rates', description: 'Find unit rates and use rate reasoning' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Ratios', title: 'Percentages', description: 'Find percentages of quantities' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Number System', title: 'Divide fractions', description: 'Divide fractions by fractions' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Number System', title: 'Negative numbers', description: 'Understand positive and negative numbers' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Number System', title: 'Absolute value', description: 'Understand and find absolute value' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Number System', title: 'Coordinate plane', description: 'Graph points in all four quadrants' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Expressions', title: 'Write expressions', description: 'Write and evaluate algebraic expressions' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Expressions', title: 'Equivalent expressions', description: 'Identify equivalent expressions' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Equations', title: 'Solve equations', description: 'Solve one-step equations' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Equations', title: 'Solve inequalities', description: 'Solve and graph inequalities' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Equations', title: 'Dependent variables', description: 'Analyze relationships between variables' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Geometry', title: 'Area of polygons', description: 'Find area of triangles and quadrilaterals' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Geometry', title: 'Volume', description: 'Find volume of rectangular prisms' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Geometry', title: 'Surface area', description: 'Represent 3D figures using nets' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Statistics', title: 'Statistical questions', description: 'Recognize statistical questions' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Statistics', title: 'Data distribution', description: 'Describe the distribution of data' },
  { gradeLevel: '6th', subjectId: 'math', category: 'Statistics', title: 'Mean, median, mode', description: 'Calculate measures of center' },

  // 6th Grade Language Arts
  { gradeLevel: '6th', subjectId: 'reading', category: 'Comprehension', title: 'Cite evidence', description: 'Cite textual evidence to support analysis' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Comprehension', title: 'Central idea', description: 'Determine central idea and how it develops' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Comprehension', title: 'Summarize', description: 'Provide objective summaries of text' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Literary Analysis', title: 'Plot development', description: 'Analyze how plot unfolds and characters respond' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Literary Analysis', title: 'Word choice', description: 'Analyze impact of word choice on meaning and tone' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Literary Analysis', title: 'Point of view', description: 'Explain how author develops point of view' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Informational Text', title: 'Arguments and claims', description: 'Trace and evaluate arguments and claims' },
  { gradeLevel: '6th', subjectId: 'reading', category: 'Informational Text', title: 'Compare presentations', description: 'Compare different media presentations' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Argumentative', title: 'Write arguments', description: 'Write arguments with clear claims and evidence' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Informative', title: 'Explanatory texts', description: 'Write informative texts examining topics' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Narrative', title: 'Narrative techniques', description: 'Use narrative techniques effectively' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Process', title: 'Research projects', description: 'Conduct short and sustained research projects' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Grammar', title: 'Pronoun usage', description: 'Use pronouns correctly in case and number' },
  { gradeLevel: '6th', subjectId: 'writing', category: 'Grammar', title: 'Sentence variety', description: 'Vary sentence patterns for effect' },

  // 6th Grade Science
  { gradeLevel: '6th', subjectId: 'science', category: 'Life Science', title: 'Cell structure', description: 'Understand cell structure and function' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Life Science', title: 'Body systems', description: 'Understand major body systems and their interactions' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Earth Science', title: 'Plate tectonics', description: 'Understand plate tectonics and Earth structure' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Earth Science', title: 'Weather systems', description: 'Understand weather patterns and systems' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Physical Science', title: 'Energy forms', description: 'Understand different forms of energy' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Physical Science', title: 'Thermal energy', description: 'Understand thermal energy transfer' },
  { gradeLevel: '6th', subjectId: 'science', category: 'Scientific Method', title: 'Design experiments', description: 'Design and conduct scientific experiments' },

  // 6th Grade Social Studies
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'History', title: 'Ancient civilizations', description: 'Study ancient civilizations (Mesopotamia, Egypt, etc.)' },
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'History', title: 'Classical civilizations', description: 'Study Greece and Rome' },
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'Geography', title: 'World geography', description: 'Study world regions and physical features' },
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'Geography', title: 'Human geography', description: 'Understand human-environment interaction' },
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'Civics', title: 'Government systems', description: 'Compare different government systems' },
  { gradeLevel: '6th', subjectId: 'social-studies', category: 'Economics', title: 'Economic systems', description: 'Compare economic systems' },

  // 6th Grade Life Skills & Other
  { gradeLevel: '6th', subjectId: 'life-skills', category: 'Study Skills', title: 'Organization systems', description: 'Develop personal organization systems' },
  { gradeLevel: '6th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Online research', description: 'Evaluate online sources for credibility' },
  { gradeLevel: '6th', subjectId: 'life-skills', category: 'Social Skills', title: 'Communication', description: 'Develop effective communication skills' },
  { gradeLevel: '6th', subjectId: 'physical-ed', category: 'Fitness', title: 'Fitness planning', description: 'Create personal fitness plans' },
  { gradeLevel: '6th', subjectId: 'art-music', category: 'Art', title: 'Art criticism', description: 'Analyze and critique artwork' },
  { gradeLevel: '6th', subjectId: 'art-music', category: 'Music', title: 'Music theory', description: 'Understand basic music theory concepts' },

  // ============================================
  // 7TH GRADE MILESTONES
  // ============================================

  // 7th Grade Mathematics
  { gradeLevel: '7th', subjectId: 'math', category: 'Ratios', title: 'Proportional relationships', description: 'Analyze proportional relationships' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Ratios', title: 'Unit rates with fractions', description: 'Compute unit rates with complex fractions' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Ratios', title: 'Percent problems', description: 'Solve multi-step percent problems' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Number System', title: 'Rational number operations', description: 'Add, subtract, multiply, divide rational numbers' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Number System', title: 'Convert rational numbers', description: 'Convert between fractions, decimals, and percents' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Expressions', title: 'Expand expressions', description: 'Apply properties to expand linear expressions' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Expressions', title: 'Factor expressions', description: 'Factor linear expressions' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Equations', title: 'Two-step equations', description: 'Solve two-step equations' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Equations', title: 'Two-step inequalities', description: 'Solve two-step inequalities' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Geometry', title: 'Scale drawings', description: 'Solve problems involving scale drawings' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Geometry', title: 'Angle relationships', description: 'Use facts about angles to solve problems' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Geometry', title: 'Area and circumference', description: 'Find area and circumference of circles' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Geometry', title: 'Cross sections', description: 'Describe cross sections of 3D figures' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Statistics', title: 'Random sampling', description: 'Understand random sampling' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Statistics', title: 'Compare populations', description: 'Draw inferences about populations' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Probability', title: 'Probability models', description: 'Develop probability models' },
  { gradeLevel: '7th', subjectId: 'math', category: 'Probability', title: 'Compound events', description: 'Find probabilities of compound events' },

  // 7th Grade Language Arts
  { gradeLevel: '7th', subjectId: 'reading', category: 'Comprehension', title: 'Multiple textual evidence', description: 'Cite several pieces of textual evidence' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Comprehension', title: 'Theme development', description: 'Analyze how themes develop over the course of text' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Literary Analysis', title: 'Story elements', description: 'Analyze how story elements interact' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Literary Analysis', title: 'Rhyme and repetition', description: 'Analyze how form contributes to meaning' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Literary Analysis', title: 'Compare perspectives', description: 'Compare different points of view' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Informational Text', title: 'Author techniques', description: 'Analyze how authors distinguish positions' },
  { gradeLevel: '7th', subjectId: 'reading', category: 'Informational Text', title: 'Evaluate arguments', description: 'Evaluate soundness of reasoning and evidence' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Argumentative', title: 'Counterclaims', description: 'Write arguments acknowledging counterclaims' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Informative', title: 'Complex topics', description: 'Write informative texts on complex topics' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Narrative', title: 'Develop experiences', description: 'Write narratives developing real or imagined experiences' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Process', title: 'Peer revision', description: 'Revise writing based on peer feedback' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Grammar', title: 'Phrase and clause types', description: 'Identify and use different phrase and clause types' },
  { gradeLevel: '7th', subjectId: 'writing', category: 'Grammar', title: 'Misplaced modifiers', description: 'Avoid and correct misplaced modifiers' },

  // 7th Grade Science
  { gradeLevel: '7th', subjectId: 'science', category: 'Life Science', title: 'Cell processes', description: 'Understand cellular processes and reproduction' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Life Science', title: 'Genetics', description: 'Understand heredity and genetics' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Life Science', title: 'Evolution', description: 'Understand natural selection and adaptation' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Earth Science', title: 'Earth history', description: 'Understand geologic time and Earth history' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Earth Science', title: 'Natural resources', description: 'Understand human impact on Earth systems' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Physical Science', title: 'Chemical reactions', description: 'Understand chemical reactions and equations' },
  { gradeLevel: '7th', subjectId: 'science', category: 'Physical Science', title: 'Force and motion', description: 'Apply Newton\'s laws of motion' },

  // 7th Grade Social Studies
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'History', title: 'Medieval world', description: 'Study medieval civilizations worldwide' },
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'History', title: 'Renaissance', description: 'Study the Renaissance and Reformation' },
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'History', title: 'Age of Exploration', description: 'Study exploration and colonization' },
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'Geography', title: 'Geographic factors', description: 'Analyze how geography influences development' },
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'Civics', title: 'Constitutional principles', description: 'Analyze constitutional principles' },
  { gradeLevel: '7th', subjectId: 'social-studies', category: 'Economics', title: 'Trade systems', description: 'Understand global trade systems' },

  // 7th Grade Life Skills & Other
  { gradeLevel: '7th', subjectId: 'life-skills', category: 'Study Skills', title: 'Independent learning', description: 'Develop independent learning strategies' },
  { gradeLevel: '7th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Digital projects', description: 'Create multimedia presentations' },
  { gradeLevel: '7th', subjectId: 'life-skills', category: 'Financial Literacy', title: 'Budgeting', description: 'Create and manage a personal budget' },
  { gradeLevel: '7th', subjectId: 'physical-ed', category: 'Fitness', title: 'Fitness goals', description: 'Set and achieve personal fitness goals' },
  { gradeLevel: '7th', subjectId: 'art-music', category: 'Art', title: 'Art techniques', description: 'Master various art techniques and media' },
  { gradeLevel: '7th', subjectId: 'art-music', category: 'Music', title: 'Music composition', description: 'Create original musical compositions' },

  // ============================================
  // 8TH GRADE MILESTONES
  // ============================================

  // 8th Grade Mathematics
  { gradeLevel: '8th', subjectId: 'math', category: 'Number System', title: 'Irrational numbers', description: 'Understand irrational numbers' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Number System', title: 'Rational approximations', description: 'Approximate irrational numbers' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Expressions', title: 'Integer exponents', description: 'Apply properties of integer exponents' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Expressions', title: 'Scientific notation', description: 'Work with scientific notation' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Expressions', title: 'Square and cube roots', description: 'Evaluate square roots and cube roots' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Equations', title: 'Linear equations', description: 'Solve linear equations in one variable' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Equations', title: 'Systems of equations', description: 'Solve systems of two linear equations' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Functions', title: 'Define functions', description: 'Understand function as a rule' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Functions', title: 'Compare functions', description: 'Compare properties of functions' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Functions', title: 'Linear functions', description: 'Model relationships with linear functions' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Geometry', title: 'Transformations', description: 'Understand congruence through transformations' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Geometry', title: 'Similarity', description: 'Understand similarity through transformations' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Geometry', title: 'Angle relationships', description: 'Understand angle relationships with parallel lines' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Geometry', title: 'Pythagorean theorem', description: 'Apply and prove the Pythagorean theorem' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Geometry', title: 'Volume formulas', description: 'Find volume of cylinders, cones, and spheres' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Statistics', title: 'Scatter plots', description: 'Construct and interpret scatter plots' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Statistics', title: 'Line of best fit', description: 'Use line of best fit to model data' },
  { gradeLevel: '8th', subjectId: 'math', category: 'Statistics', title: 'Two-way tables', description: 'Understand patterns in two-way tables' },

  // 8th Grade Language Arts
  { gradeLevel: '8th', subjectId: 'reading', category: 'Comprehension', title: 'Strong textual evidence', description: 'Cite strongest textual evidence for analysis' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Comprehension', title: 'Theme connections', description: 'Analyze theme connections across texts' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Literary Analysis', title: 'Dialogue and incidents', description: 'Analyze how dialogue propels action' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Literary Analysis', title: 'Analogies and allusions', description: 'Analyze impact of analogies and allusions' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Literary Analysis', title: 'Modern vs traditional', description: 'Compare modern and traditional texts' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Informational Text', title: 'Conflicting information', description: 'Analyze conflicting viewpoints' },
  { gradeLevel: '8th', subjectId: 'reading', category: 'Informational Text', title: 'Constitutional documents', description: 'Analyze seminal US documents' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Argumentative', title: 'Formal arguments', description: 'Write formal arguments with evidence' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Informative', title: 'Analysis writing', description: 'Write analytical essays on complex topics' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Narrative', title: 'Literary techniques', description: 'Use literary techniques in narratives' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Process', title: 'Sustained research', description: 'Conduct sustained research over time' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Grammar', title: 'Active and passive voice', description: 'Use active and passive voice effectively' },
  { gradeLevel: '8th', subjectId: 'writing', category: 'Grammar', title: 'Verbals', description: 'Form and use verbals (gerunds, participles, infinitives)' },

  // 8th Grade Science
  { gradeLevel: '8th', subjectId: 'science', category: 'Life Science', title: 'Human body systems', description: 'Understand human body systems in depth' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Life Science', title: 'Ecology', description: 'Understand ecosystem dynamics' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Earth Science', title: 'Space science', description: 'Understand Earth in the solar system' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Earth Science', title: 'Climate science', description: 'Understand climate and climate change' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Physical Science', title: 'Atomic structure', description: 'Understand atomic structure and periodic table' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Physical Science', title: 'Waves and energy', description: 'Understand wave properties and applications' },
  { gradeLevel: '8th', subjectId: 'science', category: 'Physical Science', title: 'Electricity', description: 'Understand electrical circuits and energy' },

  // 8th Grade Social Studies
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'History', title: 'American history to 1877', description: 'Study US history through Reconstruction' },
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'History', title: 'Civil War', description: 'Analyze causes and effects of the Civil War' },
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'Civics', title: 'Constitution analysis', description: 'Analyze the Constitution in depth' },
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'Civics', title: 'Citizenship', description: 'Understand rights and responsibilities of citizens' },
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'Geography', title: 'Historical geography', description: 'Analyze geographic factors in history' },
  { gradeLevel: '8th', subjectId: 'social-studies', category: 'Economics', title: 'Economic development', description: 'Understand economic development over time' },

  // 8th Grade Life Skills & Other
  { gradeLevel: '8th', subjectId: 'life-skills', category: 'Study Skills', title: 'High school prep', description: 'Prepare for high school academic expectations' },
  { gradeLevel: '8th', subjectId: 'life-skills', category: 'Career', title: 'Career exploration', description: 'Explore career interests and paths' },
  { gradeLevel: '8th', subjectId: 'life-skills', category: 'Digital Literacy', title: 'Digital portfolio', description: 'Create a digital portfolio of work' },
  { gradeLevel: '8th', subjectId: 'physical-ed', category: 'Fitness', title: 'Lifetime fitness', description: 'Develop lifelong fitness habits' },
  { gradeLevel: '8th', subjectId: 'art-music', category: 'Art', title: 'Art portfolio', description: 'Develop an art portfolio for high school' },
  { gradeLevel: '8th', subjectId: 'art-music', category: 'Music', title: 'Music performance', description: 'Perform with technical proficiency' },

  // ============================================
  // 9TH GRADE MILESTONES
  // ============================================

  // 9th Grade Mathematics (Algebra I / Geometry)
  { gradeLevel: '9th', subjectId: 'math', category: 'Algebra', title: 'Solve quadratic equations', description: 'Solve quadratic equations by multiple methods' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Algebra', title: 'Factor polynomials', description: 'Factor quadratic and polynomial expressions' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Algebra', title: 'Graph linear equations', description: 'Graph linear equations and inequalities' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Algebra', title: 'Systems of equations', description: 'Solve systems by graphing, substitution, elimination' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Algebra', title: 'Radical expressions', description: 'Simplify and operate with radical expressions' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Functions', title: 'Function notation', description: 'Use and interpret function notation' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Functions', title: 'Linear and exponential', description: 'Compare linear and exponential functions' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Functions', title: 'Sequences', description: 'Understand arithmetic and geometric sequences' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Geometry', title: 'Geometric proofs', description: 'Write and understand geometric proofs' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Geometry', title: 'Triangle congruence', description: 'Prove triangles congruent' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Geometry', title: 'Parallel and perpendicular', description: 'Prove and apply parallel and perpendicular line theorems' },
  { gradeLevel: '9th', subjectId: 'math', category: 'Statistics', title: 'Data analysis', description: 'Analyze and interpret statistical data' },

  // 9th Grade English
  { gradeLevel: '9th', subjectId: 'reading', category: 'Literature', title: 'Analyze literature', description: 'Analyze how authors develop complex characters' },
  { gradeLevel: '9th', subjectId: 'reading', category: 'Literature', title: 'Literary devices', description: 'Analyze use of literary devices' },
  { gradeLevel: '9th', subjectId: 'reading', category: 'Literature', title: 'Cultural context', description: 'Analyze how culture influences text' },
  { gradeLevel: '9th', subjectId: 'reading', category: 'Informational', title: 'Rhetoric', description: 'Analyze use of rhetoric in speeches and essays' },
  { gradeLevel: '9th', subjectId: 'reading', category: 'Informational', title: 'Seminal documents', description: 'Analyze foundational US and world documents' },
  { gradeLevel: '9th', subjectId: 'writing', category: 'Argumentative', title: 'Research-based arguments', description: 'Write arguments using research evidence' },
  { gradeLevel: '9th', subjectId: 'writing', category: 'Informative', title: 'Synthesis writing', description: 'Synthesize information from multiple sources' },
  { gradeLevel: '9th', subjectId: 'writing', category: 'Narrative', title: 'Creative writing', description: 'Write creative narratives with literary techniques' },
  { gradeLevel: '9th', subjectId: 'writing', category: 'Process', title: 'MLA format', description: 'Use MLA format for citations and papers' },
  { gradeLevel: '9th', subjectId: 'writing', category: 'Grammar', title: 'Sentence structure', description: 'Use varied and sophisticated sentence structures' },

  // 9th Grade Science (Physical Science / Biology)
  { gradeLevel: '9th', subjectId: 'science', category: 'Biology', title: 'Cell biology', description: 'Understand cell structure and processes' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Biology', title: 'Genetics', description: 'Understand DNA, RNA, and protein synthesis' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Biology', title: 'Evolution', description: 'Understand evolutionary theory and evidence' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Biology', title: 'Ecology', description: 'Understand ecosystem interactions and cycles' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Physical Science', title: 'Matter and energy', description: 'Understand properties and interactions of matter' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Physical Science', title: 'Motion and forces', description: 'Apply physics principles to motion' },
  { gradeLevel: '9th', subjectId: 'science', category: 'Lab Skills', title: 'Scientific method', description: 'Design and conduct scientific investigations' },

  // 9th Grade Social Studies
  { gradeLevel: '9th', subjectId: 'social-studies', category: 'History', title: 'World history', description: 'Study world history from ancient to modern' },
  { gradeLevel: '9th', subjectId: 'social-studies', category: 'History', title: 'Historical analysis', description: 'Analyze primary and secondary sources' },
  { gradeLevel: '9th', subjectId: 'social-studies', category: 'Geography', title: 'Human geography', description: 'Analyze human geographic patterns' },
  { gradeLevel: '9th', subjectId: 'social-studies', category: 'Civics', title: 'Government systems', description: 'Compare world government systems' },
  { gradeLevel: '9th', subjectId: 'social-studies', category: 'Economics', title: 'Global economics', description: 'Understand global economic systems' },

  // 9th Grade Life Skills & Other
  { gradeLevel: '9th', subjectId: 'life-skills', category: 'Academic', title: 'Study skills', description: 'Develop advanced study and test-taking skills' },
  { gradeLevel: '9th', subjectId: 'life-skills', category: 'Academic', title: 'Time management', description: 'Manage multiple classes and activities' },
  { gradeLevel: '9th', subjectId: 'life-skills', category: 'Career', title: 'Career planning', description: 'Begin career exploration and planning' },
  { gradeLevel: '9th', subjectId: 'physical-ed', category: 'Fitness', title: 'Personal fitness', description: 'Develop a personal fitness program' },
  { gradeLevel: '9th', subjectId: 'art-music', category: 'Art', title: 'Art specialization', description: 'Develop skills in chosen art medium' },
  { gradeLevel: '9th', subjectId: 'art-music', category: 'Music', title: 'Music specialization', description: 'Develop skills in voice or instrument' },

  // ============================================
  // 10TH GRADE MILESTONES
  // ============================================

  // 10th Grade Mathematics (Geometry / Algebra II)
  { gradeLevel: '10th', subjectId: 'math', category: 'Geometry', title: 'Circle theorems', description: 'Apply circle theorems and formulas' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Geometry', title: 'Trigonometry basics', description: 'Use trigonometric ratios in right triangles' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Geometry', title: 'Coordinate geometry', description: 'Prove geometric theorems using coordinates' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Geometry', title: 'Three-dimensional figures', description: 'Calculate surface area and volume of 3D shapes' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Algebra', title: 'Complex numbers', description: 'Understand and operate with complex numbers' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Algebra', title: 'Polynomial functions', description: 'Graph and analyze polynomial functions' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Algebra', title: 'Rational expressions', description: 'Simplify and operate with rational expressions' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Functions', title: 'Function transformations', description: 'Transform and analyze function graphs' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Functions', title: 'Exponential functions', description: 'Model with exponential functions' },
  { gradeLevel: '10th', subjectId: 'math', category: 'Statistics', title: 'Probability', description: 'Calculate probabilities using counting methods' },

  // 10th Grade English
  { gradeLevel: '10th', subjectId: 'reading', category: 'Literature', title: 'World literature', description: 'Analyze world literature across cultures' },
  { gradeLevel: '10th', subjectId: 'reading', category: 'Literature', title: 'Symbolism', description: 'Analyze symbolism and deeper meanings' },
  { gradeLevel: '10th', subjectId: 'reading', category: 'Literature', title: 'Author purpose', description: 'Analyze author purpose and perspective' },
  { gradeLevel: '10th', subjectId: 'reading', category: 'Informational', title: 'Argument analysis', description: 'Evaluate effectiveness of arguments' },
  { gradeLevel: '10th', subjectId: 'writing', category: 'Argumentative', title: 'Persuasive essays', description: 'Write sophisticated persuasive essays' },
  { gradeLevel: '10th', subjectId: 'writing', category: 'Informative', title: 'Research papers', description: 'Write extended research papers' },
  { gradeLevel: '10th', subjectId: 'writing', category: 'Literary Analysis', title: 'Literary analysis', description: 'Write analytical essays about literature' },
  { gradeLevel: '10th', subjectId: 'writing', category: 'Process', title: 'Revision strategies', description: 'Use advanced revision strategies' },

  // 10th Grade Science (Chemistry / Biology)
  { gradeLevel: '10th', subjectId: 'science', category: 'Chemistry', title: 'Atomic structure', description: 'Understand atomic structure and electron configuration' },
  { gradeLevel: '10th', subjectId: 'science', category: 'Chemistry', title: 'Chemical bonding', description: 'Understand chemical bonding types' },
  { gradeLevel: '10th', subjectId: 'science', category: 'Chemistry', title: 'Chemical reactions', description: 'Balance and predict chemical reactions' },
  { gradeLevel: '10th', subjectId: 'science', category: 'Chemistry', title: 'Stoichiometry', description: 'Perform stoichiometric calculations' },
  { gradeLevel: '10th', subjectId: 'science', category: 'Biology', title: 'Advanced biology', description: 'Study advanced biological concepts' },
  { gradeLevel: '10th', subjectId: 'science', category: 'Lab Skills', title: 'Lab techniques', description: 'Use advanced laboratory techniques' },

  // 10th Grade Social Studies
  { gradeLevel: '10th', subjectId: 'social-studies', category: 'History', title: 'Modern world history', description: 'Study modern world history (1500-present)' },
  { gradeLevel: '10th', subjectId: 'social-studies', category: 'History', title: 'Historical research', description: 'Conduct independent historical research' },
  { gradeLevel: '10th', subjectId: 'social-studies', category: 'Civics', title: 'Comparative government', description: 'Compare government systems worldwide' },
  { gradeLevel: '10th', subjectId: 'social-studies', category: 'Economics', title: 'Economics principles', description: 'Understand micro and macroeconomics' },

  // 10th Grade Life Skills
  { gradeLevel: '10th', subjectId: 'life-skills', category: 'Academic', title: 'College planning', description: 'Begin college exploration and planning' },
  { gradeLevel: '10th', subjectId: 'life-skills', category: 'Academic', title: 'SAT/ACT prep', description: 'Begin standardized test preparation' },
  { gradeLevel: '10th', subjectId: 'life-skills', category: 'Career', title: 'Job skills', description: 'Develop workplace skills' },
  { gradeLevel: '10th', subjectId: 'life-skills', category: 'Financial', title: 'Personal finance', description: 'Understand personal finance principles' },

  // ============================================
  // 11TH GRADE MILESTONES
  // ============================================

  // 11th Grade Mathematics (Algebra II / Pre-Calculus)
  { gradeLevel: '11th', subjectId: 'math', category: 'Algebra', title: 'Logarithms', description: 'Understand and apply logarithmic functions' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Algebra', title: 'Matrices', description: 'Perform matrix operations' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Functions', title: 'Rational functions', description: 'Graph and analyze rational functions' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Functions', title: 'Inverse functions', description: 'Find and use inverse functions' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Trigonometry', title: 'Unit circle', description: 'Understand the unit circle and trig functions' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Trigonometry', title: 'Trig identities', description: 'Prove and use trigonometric identities' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Trigonometry', title: 'Law of sines/cosines', description: 'Apply laws of sines and cosines' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Statistics', title: 'Statistical inference', description: 'Make and justify statistical inferences' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Pre-Calculus', title: 'Limits introduction', description: 'Understand the concept of limits' },
  { gradeLevel: '11th', subjectId: 'math', category: 'Pre-Calculus', title: 'Sequences and series', description: 'Work with sequences and series' },

  // 11th Grade English (American Literature)
  { gradeLevel: '11th', subjectId: 'reading', category: 'Literature', title: 'American literature', description: 'Study American literature across periods' },
  { gradeLevel: '11th', subjectId: 'reading', category: 'Literature', title: 'Historical context', description: 'Analyze literature in historical context' },
  { gradeLevel: '11th', subjectId: 'reading', category: 'Literature', title: 'Multiple interpretations', description: 'Analyze multiple interpretations of texts' },
  { gradeLevel: '11th', subjectId: 'reading', category: 'Rhetoric', title: 'Rhetorical analysis', description: 'Analyze rhetorical strategies in texts' },
  { gradeLevel: '11th', subjectId: 'writing', category: 'Argumentative', title: 'College-level arguments', description: 'Write college-level argumentative essays' },
  { gradeLevel: '11th', subjectId: 'writing', category: 'Research', title: 'Extended research', description: 'Complete extended research projects' },
  { gradeLevel: '11th', subjectId: 'writing', category: 'Process', title: 'College essays', description: 'Write college application essays' },

  // 11th Grade Science (Chemistry / Physics)
  { gradeLevel: '11th', subjectId: 'science', category: 'Chemistry', title: 'Advanced chemistry', description: 'Study advanced chemistry concepts' },
  { gradeLevel: '11th', subjectId: 'science', category: 'Chemistry', title: 'Organic chemistry intro', description: 'Introduction to organic chemistry' },
  { gradeLevel: '11th', subjectId: 'science', category: 'Physics', title: 'Mechanics', description: 'Understand kinematics and dynamics' },
  { gradeLevel: '11th', subjectId: 'science', category: 'Physics', title: 'Energy and momentum', description: 'Apply conservation principles' },
  { gradeLevel: '11th', subjectId: 'science', category: 'Physics', title: 'Waves and optics', description: 'Understand wave phenomena and optics' },
  { gradeLevel: '11th', subjectId: 'science', category: 'Lab Skills', title: 'Research skills', description: 'Conduct independent scientific research' },

  // 11th Grade Social Studies (US History)
  { gradeLevel: '11th', subjectId: 'social-studies', category: 'History', title: 'US History', description: 'Study comprehensive US history' },
  { gradeLevel: '11th', subjectId: 'social-studies', category: 'History', title: '20th century America', description: 'Analyze 20th century American history' },
  { gradeLevel: '11th', subjectId: 'social-studies', category: 'Civics', title: 'Constitutional law', description: 'Study constitutional law and cases' },
  { gradeLevel: '11th', subjectId: 'social-studies', category: 'Economics', title: 'American economy', description: 'Understand American economic history' },

  // 11th Grade Life Skills
  { gradeLevel: '11th', subjectId: 'life-skills', category: 'College Prep', title: 'SAT/ACT', description: 'Take SAT or ACT exams' },
  { gradeLevel: '11th', subjectId: 'life-skills', category: 'College Prep', title: 'College visits', description: 'Visit prospective colleges' },
  { gradeLevel: '11th', subjectId: 'life-skills', category: 'College Prep', title: 'Scholarship research', description: 'Research scholarship opportunities' },
  { gradeLevel: '11th', subjectId: 'life-skills', category: 'Career', title: 'Internships', description: 'Explore internship opportunities' },

  // ============================================
  // 12TH GRADE MILESTONES
  // ============================================

  // 12th Grade Mathematics (Pre-Calculus / Calculus / Statistics)
  { gradeLevel: '12th', subjectId: 'math', category: 'Calculus', title: 'Derivatives', description: 'Understand and calculate derivatives' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Calculus', title: 'Integrals', description: 'Understand and calculate integrals' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Calculus', title: 'Applications', description: 'Apply calculus to real-world problems' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Statistics', title: 'AP Statistics', description: 'Master AP Statistics concepts' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Advanced', title: 'Conic sections', description: 'Analyze conic sections' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Advanced', title: 'Polar coordinates', description: 'Work with polar and parametric equations' },
  { gradeLevel: '12th', subjectId: 'math', category: 'Advanced', title: 'Vectors', description: 'Understand and apply vectors' },

  // 12th Grade English (British/World Literature)
  { gradeLevel: '12th', subjectId: 'reading', category: 'Literature', title: 'British literature', description: 'Study British literature across periods' },
  { gradeLevel: '12th', subjectId: 'reading', category: 'Literature', title: 'Critical theory', description: 'Apply critical theory to literature' },
  { gradeLevel: '12th', subjectId: 'reading', category: 'Literature', title: 'Independent reading', description: 'Read and analyze texts independently' },
  { gradeLevel: '12th', subjectId: 'writing', category: 'Academic', title: 'Academic writing', description: 'Write college-level academic papers' },
  { gradeLevel: '12th', subjectId: 'writing', category: 'Research', title: 'Senior thesis', description: 'Complete a senior research project' },
  { gradeLevel: '12th', subjectId: 'writing', category: 'Creative', title: 'Portfolio', description: 'Develop a writing portfolio' },

  // 12th Grade Science (Physics / AP Sciences)
  { gradeLevel: '12th', subjectId: 'science', category: 'Physics', title: 'Electricity and magnetism', description: 'Understand electricity and magnetism' },
  { gradeLevel: '12th', subjectId: 'science', category: 'Physics', title: 'Modern physics', description: 'Introduction to modern physics' },
  { gradeLevel: '12th', subjectId: 'science', category: 'Advanced', title: 'AP Science', description: 'Complete AP science coursework' },
  { gradeLevel: '12th', subjectId: 'science', category: 'Research', title: 'Science research', description: 'Conduct independent science research' },

  // 12th Grade Social Studies (Government / Economics)
  { gradeLevel: '12th', subjectId: 'social-studies', category: 'Civics', title: 'US Government', description: 'Study US government in depth' },
  { gradeLevel: '12th', subjectId: 'social-studies', category: 'Civics', title: 'Civic participation', description: 'Understand civic responsibilities' },
  { gradeLevel: '12th', subjectId: 'social-studies', category: 'Economics', title: 'Economics', description: 'Study micro and macroeconomics' },
  { gradeLevel: '12th', subjectId: 'social-studies', category: 'Economics', title: 'Personal economics', description: 'Apply economics to personal decisions' },
  { gradeLevel: '12th', subjectId: 'social-studies', category: 'Current Events', title: 'Current events', description: 'Analyze current events critically' },

  // 12th Grade Life Skills
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'College Prep', title: 'College applications', description: 'Complete college applications' },
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'College Prep', title: 'Financial aid', description: 'Complete FAFSA and scholarship applications' },
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'Life Skills', title: 'Adult responsibilities', description: 'Understand adult responsibilities and tasks' },
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'Life Skills', title: 'Independent living', description: 'Prepare for independent living' },
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'Career', title: 'Career preparation', description: 'Prepare for career or further education' },
  { gradeLevel: '12th', subjectId: 'life-skills', category: 'Financial', title: 'Financial planning', description: 'Create personal financial plans' }
]
