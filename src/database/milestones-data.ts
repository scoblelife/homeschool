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
  ]}
]
