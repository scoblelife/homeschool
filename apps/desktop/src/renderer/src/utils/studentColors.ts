/**
 * Student color definitions and lookup utility.
 *
 * Shared across Dashboard, LearningLog, Settings, WeeklySummary, AnnualReport, etc.
 */

export const STUDENT_COLORS = [
  {
    id: "fuchsia",
    name: "Fuchsia",
    bg: "bg-student-fuchsia-500",
    ring: "ring-student-fuchsia-500",
    bgLight: "bg-student-fuchsia-50",
    border: "border-l-student-fuchsia-500",
    text: "text-student-fuchsia-600",
  },
  {
    id: "teal",
    name: "Teal",
    bg: "bg-student-teal-500",
    ring: "ring-student-teal-500",
    bgLight: "bg-student-teal-50",
    border: "border-l-student-teal-500",
    text: "text-student-teal-600",
  },
  {
    id: "blue",
    name: "Blue",
    bg: "bg-student-blue-500",
    ring: "ring-student-blue-500",
    bgLight: "bg-student-blue-50",
    border: "border-l-student-blue-500",
    text: "text-student-blue-600",
  },
  {
    id: "orange",
    name: "Orange",
    bg: "bg-student-orange-500",
    ring: "ring-student-orange-500",
    bgLight: "bg-student-orange-50",
    border: "border-l-student-orange-500",
    text: "text-student-orange-600",
  },
  {
    id: "purple",
    name: "Purple",
    bg: "bg-student-purple-500",
    ring: "ring-student-purple-500",
    bgLight: "bg-student-purple-50",
    border: "border-l-student-purple-500",
    text: "text-student-purple-600",
  },
  {
    id: "green",
    name: "Green",
    bg: "bg-student-green-500",
    ring: "ring-student-green-500",
    bgLight: "bg-student-green-50",
    border: "border-l-student-green-500",
    text: "text-student-green-600",
  },
] as const;

export type StudentColor = (typeof STUDENT_COLORS)[number];

export function getStudentColor(colorId: string): StudentColor {
  if (colorId === "child1") return STUDENT_COLORS[0];
  if (colorId === "child2") return STUDENT_COLORS[1];
  return STUDENT_COLORS.find((c) => c.id === colorId) || STUDENT_COLORS[0];
}
