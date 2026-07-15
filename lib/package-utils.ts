import type { ServiceType } from "@/types/Services";

const serviceTypeToSubmenuMap: Record<string, string> = {
  "one-on-1-tutoring": "one",
  "one-on-one-tutoring": "one",
  "1-on-1-tutoring": "one",
  "group-tutoring": "group",
  "self-study": "subscribe",
};

const courseCodeToIdMap: Record<string, string> = {
  asvab: "40",
  afoqt: "49",
  sift: "50",
  astb: "51",
  oar: "52",
  "hesi-a2": "56",
  "ati-teas": "57",
  cna: "58",
};

export const MILITARY_COURSE_CODES = [
  "asvab",
  "afoqt",
  "sift",
  "astb",
  "oar",
] as const;

export const MEDICAL_COURSE_CODES = ["hesi-a2", "ati-teas", "cna"] as const;


// Navbar course categorization
export type CourseNavCategory =
  | "military test prep"
  | "healthcare test prep"
  | "academic test prep";

export function getCourseNavCategory(courseCode: string): CourseNavCategory {
  const code = (courseCode ?? "").toLowerCase();
  if ((MILITARY_COURSE_CODES as readonly string[]).includes(code)) {
    return "military test prep";
  }
  if ((MEDICAL_COURSE_CODES as readonly string[]).includes(code)) {
    return "healthcare test prep";
  }
  if (code.includes("hesi") || code.includes("teas") || code.includes("cna")) {
    return "healthcare test prep";
  }
  return "academic test prep";
}

export function groupCoursesForNav<T extends { course_code: string }>(
  courses: readonly T[],
): {
  militaryTestPrep: T[];
  healthcareTestPrep: T[];
  academicTestPrep: T[];
} {
  const militaryTestPrep: T[] = [];
  const healthcareTestPrep: T[] = [];
  const academicTestPrep: T[] = [];

  for (const course of courses) {
    const category = getCourseNavCategory(course.course_code);
    if (category === "military test prep") militaryTestPrep.push(course);
    else if (category === "healthcare test prep")
      healthcareTestPrep.push(course);
    else academicTestPrep.push(course);
  }

  return { militaryTestPrep, healthcareTestPrep, academicTestPrep };
}
// End of Navbar course categorization

export function getFriendlyCourseName(courseCode: string): string {
  const code = courseCode.toLowerCase();
  if (code.includes("asvab")) return "ASVAB";
  if (code.includes("afoqt")) return "AFOQT";
  if (code.includes("astb")) return "ASTB";
  if (code.includes("sift")) return "SIFT";
  if (code.includes("oar")) return "OAR";
  if (code.includes("hesi")) return "HESI A2";
  if (code.includes("teas")) return "ATI TEAS";
  if (code.includes("cna")) return "CNA";
  return "Military Prep";
}

export function convertServiceTypeToSubmenu(serviceType: string): string {
  return serviceTypeToSubmenuMap[serviceType] ?? serviceType;
}

export function convertCourseCodeToId(courseCode: string): string {
  return courseCodeToIdMap[courseCode.toLowerCase()] ?? courseCode;
}

export function convertCourseIdToProduct(courseId: string): string {
  const entry = Object.entries(courseCodeToIdMap).find(
    ([, id]) => id === String(courseId),
  );
  return entry ? getFriendlyCourseName(entry[0]) : "";
}

export type PricingSubmenu = "one" | "group" | "subscribe";

export function serviceTypeToSubmenu(serviceType: string): PricingSubmenu {
  switch (serviceType) {
    case "1-on-1-tutoring":
      return "one";
    case "group-tutoring":
      return "group";
    case "self-study":
      return "subscribe";
    default:
      return "one";
  }
}

export function submenuToServiceType(submenu: PricingSubmenu): ServiceType {
  switch (submenu) {
    case "one":
      return "1-on-1-tutoring";
    case "group":
      return "group-tutoring";
    case "subscribe":
      return "self-study";
  }
}
