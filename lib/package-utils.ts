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
export type CourseNavCategory = "military" | "medical" | "other";

export function getCourseNavCategory(courseCode: string): CourseNavCategory {
  const code = courseCode.toLowerCase();
  if ((MILITARY_COURSE_CODES as readonly string[]).includes(code)) {
    return "military";
  }
  if ((MEDICAL_COURSE_CODES as readonly string[]).includes(code)) {
    return "medical";
  }
  if (code.includes("hesi") || code.includes("teas") || code.includes("cna")) {
    return "medical";
  }
  return "other";
}

export function groupCoursesForNav<T extends { course_code: string }>(
  courses: readonly T[],
): { military: T[]; medical: T[]; other: T[] } {
  const military: T[] = [];
  const medical: T[] = [];
  const other: T[] = [];

  for (const course of courses) {
    const category = getCourseNavCategory(course.course_code);
    if (category === "military") military.push(course);
    else if (category === "medical") medical.push(course);
    else other.push(course);
  }

  return { military, medical, other };
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
