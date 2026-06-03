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
};

export function convertServiceTypeToSubmenu(serviceType: string): string {
  return serviceTypeToSubmenuMap[serviceType] ?? serviceType;
}

export function convertCourseCodeToId(courseCode: string): string {
  return courseCodeToIdMap[courseCode.toLowerCase()] ?? courseCode;
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
