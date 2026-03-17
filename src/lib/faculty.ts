import type { Faculty } from "@/generated/prisma/browser";

export const FACULTY_CONFIG = {
  ENGINEERING: {
    name: "วิศวกรรมศาสตร์",
    shortName: "วิศวะ",
    emoji: "🔴",
    color: "var(--color-faculty-eng)",
    textColor: "var(--color-faculty-eng-text)",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-200",
    bgLight: "bg-red-50",
    gradient: "from-red-50 to-red-100",
  },
  SCIENCE: {
    name: "วิทยาศาสตร์",
    shortName: "วิทย์",
    emoji: "🟡",
    color: "var(--color-faculty-sci)",
    textColor: "var(--color-faculty-sci-text)",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-200",
    bgLight: "bg-yellow-50",
    gradient: "from-yellow-50 to-yellow-100",
  },
  PHARMACY: {
    name: "เภสัชศาสตร์",
    shortName: "เภสัช",
    emoji: "🟢",
    color: "var(--color-faculty-pharm)",
    textColor: "var(--color-faculty-pharm-text)",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    borderClass: "border-green-200",
    bgLight: "bg-green-50",
    gradient: "from-green-50 to-green-100",
  },
} as const;

export type FacultyKey = keyof typeof FACULTY_CONFIG;

export function getFacultyConfig(faculty: string) {
  return FACULTY_CONFIG[faculty as FacultyKey] ?? FACULTY_CONFIG.ENGINEERING;
}
