/**
 * Document Template Engine
 *
 * Generates fillable documents for state compliance.
 */

import { format } from 'date-fns'
import type { Student } from '../../shared/types'

export interface DocumentData {
  students: Student[]
  parentName: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  email?: string
  schoolYear: string
  schoolName?: string
}

export interface GeneratedDocument {
  title: string
  content: string
  format: 'text' | 'html'
}

/**
 * Generate Notice of Intent document
 */
export function generateNoticeOfIntent(data: DocumentData): GeneratedDocument {
  const today = format(new Date(), 'MMMM d, yyyy')
  const [startYear, endYear] = data.schoolYear.split('/')

  const studentList = data.students
    .map((s) => `${s.name} (Grade: ${s.gradeLevel}, Date of Birth: ${s.dateOfBirth || 'N/A'})`)
    .join('\n')

  const content = `
NOTICE OF INTENT TO HOMESCHOOL

Date: ${today}

To: Superintendent of Schools
    ${data.city}, ${data.state}

From: ${data.parentName}
      ${data.address}
      ${data.city}, ${data.state} ${data.zip}
      ${data.phone ? `Phone: ${data.phone}` : ''}
      ${data.email ? `Email: ${data.email}` : ''}

RE: Notice of Intent to Provide Home Education for the ${startYear}-${endYear} School Year

Dear Superintendent,

This letter serves as formal notification that I intend to provide home education for the following child(ren) during the ${startYear}-${endYear} school year:

${studentList}

In accordance with state law, I am providing this notice of my intent to establish a home education program for my child(ren). I understand the requirements for home education in ${data.state} and will comply with all applicable laws and regulations.

The home education program will include instruction in the following subjects as required by state law:
- Language Arts (Reading, Writing, Spelling, Grammar)
- Mathematics
- Science
- Social Studies
- Health and Physical Education

I will maintain appropriate records of our home education program as required by law.

Please acknowledge receipt of this notice. If you require any additional information, please contact me at the address above.

Sincerely,

_______________________________
${data.parentName}
Parent/Guardian

Date: ________________
`.trim()

  return {
    title: `Notice of Intent - ${data.schoolYear}`,
    content,
    format: 'text',
  }
}

/**
 * Generate Attendance Record form
 */
export function generateAttendanceRecord(
  data: DocumentData,
  attendanceData: Array<{ date: string; status: string }>
): GeneratedDocument {
  const [startYear, endYear] = data.schoolYear.split('/')

  const studentInfo = data.students
    .map((s) => `<p><strong>Student:</strong> ${s.name} | <strong>Grade:</strong> ${s.gradeLevel}</p>`)
    .join('')

  const monthlyRecords = generateMonthlyAttendance(attendanceData, parseInt(startYear))

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>Attendance Record ${data.schoolYear}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
    th { background: #f5f5f5; }
    .header { margin-bottom: 20px; }
    .signature { margin-top: 40px; }
    .totals { font-weight: bold; background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>Home Education Attendance Record</h1>
  <h2>School Year: ${startYear}-${endYear}</h2>

  <div class="header">
    <p><strong>Parent/Guardian:</strong> ${data.parentName}</p>
    <p><strong>Address:</strong> ${data.address}, ${data.city}, ${data.state} ${data.zip}</p>
    ${studentInfo}
  </div>

  ${monthlyRecords}

  <div class="signature">
    <p>I certify that the above attendance record is accurate and complete.</p>
    <p><br><br>_______________________________<br>${data.parentName}<br>Date: ________________</p>
  </div>
</body>
</html>
`.trim()

  return {
    title: `Attendance Record - ${data.schoolYear}`,
    content,
    format: 'html',
  }
}

function generateMonthlyAttendance(
  attendanceData: Array<{ date: string; status: string }>,
  startYear: number
): string {
  const months = [
    { name: 'August', year: startYear },
    { name: 'September', year: startYear },
    { name: 'October', year: startYear },
    { name: 'November', year: startYear },
    { name: 'December', year: startYear },
    { name: 'January', year: startYear + 1 },
    { name: 'February', year: startYear + 1 },
    { name: 'March', year: startYear + 1 },
    { name: 'April', year: startYear + 1 },
    { name: 'May', year: startYear + 1 },
    { name: 'June', year: startYear + 1 },
    { name: 'July', year: startYear + 1 },
  ]

  const attendanceMap = new Map(attendanceData.map((a) => [a.date, a.status]))

  let totalDays = 0
  const tables = months
    .map((month) => {
      const daysInMonth = new Date(month.year, months.indexOf(month) < 5 ? months.indexOf(month) + 7 : months.indexOf(month) - 5, 0).getDate()
      let monthDays = 0

      const rows = []
      for (let week = 0; week < 5; week++) {
        const weekDays = []
        for (let day = week * 7 + 1; day <= Math.min((week + 1) * 7, daysInMonth); day++) {
          const dateStr = `${month.year}-${String(months.indexOf(month) < 5 ? months.indexOf(month) + 8 : months.indexOf(month) - 4).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const status = attendanceMap.get(dateStr)
          if (status === 'school') {
            monthDays++
            weekDays.push(`<td style="background:#90EE90">${day}</td>`)
          } else if (status) {
            weekDays.push(`<td style="background:#FFE4B5" title="${status}">${day}</td>`)
          } else {
            weekDays.push(`<td>${day}</td>`)
          }
        }
        if (weekDays.length > 0) {
          rows.push(`<tr>${weekDays.join('')}</tr>`)
        }
      }

      totalDays += monthDays

      return `
        <h3>${month.name} ${month.year}</h3>
        <table>
          <tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr>
          ${rows.join('')}
          <tr class="totals"><td colspan="7">School Days: ${monthDays}</td></tr>
        </table>
      `
    })
    .join('')

  return `
    ${tables}
    <h3 class="totals">Total School Days: ${totalDays}</h3>
    <p>Green = School Day | Orange = Other (holiday, sick, vacation)</p>
  `
}

/**
 * Generate Individualized Home Instruction Plan (IHIP) for NY
 */
export function generateIHIP(
  data: DocumentData,
  curriculum: Array<{ subject: string; materials: string; goals: string }>
): GeneratedDocument {
  const [startYear, endYear] = data.schoolYear.split('/')

  const curriculumRows = curriculum
    .map(
      (c) => `
      <tr>
        <td>${c.subject}</td>
        <td>${c.materials}</td>
        <td>${c.goals}</td>
      </tr>
    `
    )
    .join('')

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>IHIP ${data.schoolYear}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    .header { margin-bottom: 20px; }
    .signature { margin-top: 40px; }
  </style>
</head>
<body>
  <h1>Individualized Home Instruction Plan (IHIP)</h1>
  <h2>School Year: ${startYear}-${endYear}</h2>

  <div class="header">
    <p><strong>Parent/Guardian:</strong> ${data.parentName}</p>
    <p><strong>Address:</strong> ${data.address}, ${data.city}, ${data.state} ${data.zip}</p>
    ${data.students.map((s) => `<p><strong>Student:</strong> ${s.name} | <strong>Grade:</strong> ${s.gradeLevel}</p>`).join('')}
  </div>

  <h3>Curriculum Plan</h3>
  <table>
    <tr>
      <th>Subject</th>
      <th>Materials/Textbooks</th>
      <th>Goals/Objectives</th>
    </tr>
    ${curriculumRows}
  </table>

  <h3>Instructional Hours</h3>
  <p>This home instruction program will provide a minimum of:</p>
  <ul>
    <li>900 hours of instruction (grades K-6)</li>
    <li>990 hours of instruction (grades 7-12)</li>
  </ul>

  <h3>Assessment Method</h3>
  <p>Annual assessment will be conducted through: ☐ Standardized Test ☐ Written Evaluation</p>

  <div class="signature">
    <p>I certify that I will provide instruction in the required subjects as outlined in this plan.</p>
    <p><br><br>_______________________________<br>${data.parentName}<br>Parent/Guardian</p>
    <p>Date: ________________</p>
  </div>
</body>
</html>
`.trim()

  return {
    title: `IHIP - ${data.students.map((s) => s.name).join(', ')} - ${data.schoolYear}`,
    content,
    format: 'html',
  }
}

/**
 * Generate Quarterly Report for NY
 */
export function generateQuarterlyReport(
  data: DocumentData,
  quarter: 1 | 2 | 3 | 4,
  activities: Array<{ subject: string; description: string; hours: number }>
): GeneratedDocument {
  const [startYear, endYear] = data.schoolYear.split('/')
  const quarterNames = ['First', 'Second', 'Third', 'Fourth']
  const quarterDates = [
    'September - November',
    'December - February',
    'March - April',
    'May - June',
  ]

  const activityRows = activities
    .map(
      (a) => `
      <tr>
        <td>${a.subject}</td>
        <td>${a.description}</td>
        <td>${a.hours}</td>
      </tr>
    `
    )
    .join('')

  const totalHours = activities.reduce((sum, a) => sum + a.hours, 0)

  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>Quarterly Report Q${quarter} ${data.schoolYear}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .totals { font-weight: bold; background: #f0f0f0; }
    .signature { margin-top: 40px; }
  </style>
</head>
<body>
  <h1>${quarterNames[quarter - 1]} Quarter Report</h1>
  <h2>${quarterDates[quarter - 1]} | School Year ${startYear}-${endYear}</h2>

  <div class="header">
    <p><strong>Parent/Guardian:</strong> ${data.parentName}</p>
    ${data.students.map((s) => `<p><strong>Student:</strong> ${s.name} | <strong>Grade:</strong> ${s.gradeLevel}</p>`).join('')}
  </div>

  <h3>Instructional Activities</h3>
  <table>
    <tr>
      <th>Subject</th>
      <th>Activities/Description</th>
      <th>Hours</th>
    </tr>
    ${activityRows}
    <tr class="totals">
      <td colspan="2">Total Hours This Quarter</td>
      <td>${totalHours}</td>
    </tr>
  </table>

  <h3>Progress Summary</h3>
  <p>The student is making satisfactory progress in the home instruction program.</p>

  <div class="signature">
    <p>I certify that the above report is accurate.</p>
    <p><br><br>_______________________________<br>${data.parentName}<br>Parent/Guardian</p>
    <p>Date: ________________</p>
  </div>
</body>
</html>
`.trim()

  return {
    title: `Q${quarter} Report - ${data.students.map((s) => s.name).join(', ')} - ${data.schoolYear}`,
    content,
    format: 'html',
  }
}
