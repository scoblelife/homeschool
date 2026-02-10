import type { Student, GradeLevel } from "../../../../shared/types";

export const GRADE_LABELS: Record<GradeLevel | string, string> = {
  "pre-k": "Pre-Kindergarten",
  "1st": "First Grade",
  "2nd": "Second Grade",
  "3rd": "Third Grade",
  "4th": "Fourth Grade",
  "5th": "Fifth Grade",
};

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getSchoolYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  // School year starts in August
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

export interface MilestoneCertificateData {
  studentName: string;
  milestoneTitle: string;
  completionDate: string;
  subjectName?: string;
  teacherName?: string;
}

export interface GradeCertificateData {
  studentName: string;
  gradeLevel: GradeLevel | string;
  schoolYear: string;
  totalHours: number;
  subjects: string[];
  completionDate: string;
  teacherName?: string;
}

export function generateMilestoneCertificateHTML(
  data: MilestoneCertificateData,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Achievement</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: landscape;
      margin: 0;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      background: white;
    }

    .certificate {
      width: 11in;
      height: 8.5in;
      padding: 0.5in;
      background: linear-gradient(135deg, #fdf4ff 0%, #ffffff 50%, #f5f3ff 100%);
      position: relative;
      overflow: hidden;
    }

    .border {
      position: absolute;
      inset: 0.3in;
      border: 3px solid #d946ef;
      border-radius: 8px;
    }

    .border-inner {
      position: absolute;
      inset: 0.4in;
      border: 1px solid #e879f9;
      border-radius: 4px;
    }

    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 0.5in;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header {
      margin-bottom: 1rem;
    }

    .ribbon {
      font-size: 14px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #9333ea;
      margin-bottom: 0.5rem;
    }

    .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 16px;
      color: #6b7280;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .presented-to {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 0.5rem;
    }

    .student-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 56px;
      font-weight: 600;
      color: #d946ef;
      margin-bottom: 1rem;
    }

    .achievement {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 0.5rem;
    }

    .milestone {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      max-width: 80%;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      border-top: 2px solid #e879f9;
      border-bottom: 2px solid #e879f9;
    }

    ${
      data.subjectName
        ? `
    .subject {
      margin-top: 0.75rem;
      font-size: 14px;
      color: #6b7280;
    }
    `
        : ""
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 1rem;
    }

    .date-section, .signature-section {
      text-align: center;
    }

    .date {
      font-size: 14px;
      color: #4b5563;
    }

    .signature-line {
      width: 200px;
      border-bottom: 1px solid #9ca3af;
      margin-bottom: 0.25rem;
      height: 40px;
    }

    .signature-label {
      font-size: 12px;
      color: #6b7280;
    }

    .seal {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #d946ef, #9333ea);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      box-shadow: 0 4px 12px rgba(217, 70, 239, 0.3);
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border"></div>
    <div class="border-inner"></div>
    <div class="content">
      <div class="header">
        <div class="ribbon">Certificate</div>
        <h1 class="title">Achievement</h1>
        <p class="subtitle">of Learning Excellence</p>
      </div>

      <div class="main">
        <p class="presented-to">This certifies that</p>
        <h2 class="student-name">${data.studentName}</h2>
        <p class="achievement">has successfully completed</p>
        <p class="milestone">${data.milestoneTitle}</p>
        ${data.subjectName ? `<p class="subject">in ${data.subjectName}</p>` : ""}
      </div>

      <div class="footer">
        <div class="date-section">
          <p class="date">${formatDate(data.completionDate)}</p>
          <p class="signature-label">Date of Completion</p>
        </div>

        <div class="seal">🏆</div>

        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-label">${data.teacherName || "Parent/Teacher"}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateGradeCertificateHTML(
  data: GradeCertificateData,
): string {
  const gradeLabel = GRADE_LABELS[data.gradeLevel] || data.gradeLevel;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: landscape;
      margin: 0;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      background: white;
    }

    .certificate {
      width: 11in;
      height: 8.5in;
      padding: 0.5in;
      background: linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%);
      position: relative;
      overflow: hidden;
    }

    .border {
      position: absolute;
      inset: 0.3in;
      border: 3px solid #3b82f6;
      border-radius: 8px;
    }

    .border-inner {
      position: absolute;
      inset: 0.4in;
      border: 1px solid #60a5fa;
      border-radius: 4px;
    }

    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 0.4in 0.5in;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header {
      margin-bottom: 0.5rem;
    }

    .ribbon {
      font-size: 12px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #2563eb;
      margin-bottom: 0.25rem;
    }

    .title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 40px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 14px;
      color: #6b7280;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .presented-to {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 0.25rem;
    }

    .student-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48px;
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }

    .completion-text {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 0.25rem;
    }

    .grade-level {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
    }

    .school-year {
      font-size: 16px;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 0.75rem;
      padding: 0.5rem 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      font-weight: 600;
      color: #3b82f6;
    }

    .stat-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .subjects {
      margin-top: 0.5rem;
      font-size: 11px;
      color: #6b7280;
    }

    .subjects span {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      margin: 0.125rem;
      background: #f3f4f6;
      border-radius: 9999px;
    }

    .certification-text {
      margin-top: 0.75rem;
      font-size: 11px;
      color: #4b5563;
      font-style: italic;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.4;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 0.5rem;
    }

    .date-section, .signature-section {
      text-align: center;
    }

    .date {
      font-size: 12px;
      color: #4b5563;
    }

    .signature-line {
      width: 180px;
      border-bottom: 1px solid #9ca3af;
      margin-bottom: 0.25rem;
      height: 30px;
    }

    .signature-label {
      font-size: 10px;
      color: #6b7280;
    }

    .seal {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #3b82f6, #22c55e);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border"></div>
    <div class="border-inner"></div>
    <div class="content">
      <div class="header">
        <div class="ribbon">Certificate of</div>
        <h1 class="title">Completion</h1>
        <p class="subtitle">Homeschool Achievement Record</p>
      </div>

      <div class="main">
        <p class="presented-to">This certifies that</p>
        <h2 class="student-name">${data.studentName}</h2>
        <p class="completion-text">has successfully completed all requirements for</p>
        <p class="grade-level">${gradeLabel}</p>
        <p class="school-year">School Year ${data.schoolYear}</p>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">${data.totalHours}</div>
            <div class="stat-label">Total Hours</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.subjects.length}</div>
            <div class="stat-label">Subjects</div>
          </div>
        </div>

        <div class="subjects">
          ${data.subjects.map((s) => `<span>${s}</span>`).join("")}
        </div>

        <p class="certification-text">
          I hereby certify that the above-named student has satisfactorily completed the
          course of study required for ${gradeLabel} during the ${data.schoolYear} school year,
          and is promoted to the next grade level.
        </p>
      </div>

      <div class="footer">
        <div class="date-section">
          <p class="date">${formatDate(data.completionDate)}</p>
          <p class="signature-label">Date Issued</p>
        </div>

        <div class="seal">🎓</div>

        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-label">${data.teacherName || "Parent/Teacher"}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
