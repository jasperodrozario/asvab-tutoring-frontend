export const ASVAB_RESOURCES = [
  {
    path: "/military-asvab-test",
    label: "Military ASVAB Test",
    description: "Understand the test, your scores, and where to begin.",
  },
  {
    path: "/asvab-math-practice-test",
    label: "ASVAB Math Practice Test",
    description: "Work through eight original questions with explained answers.",
  },
  {
    path: "/asvab-prep-classes",
    label: "ASVAB Prep Classes",
    description: "Explore online instruction for schools and organized groups.",
  },
  {
    path: "/asvab-study-guide",
    label: "ASVAB Study Guide",
    description: "Build a study routine around the skills you need to improve.",
  },
  {
    path: "/asvab-tutor",
    label: "Online ASVAB Tutor",
    description: "Find individual support and explore private tutoring options.",
  },
] as const;

export type AsvabResourcePath = (typeof ASVAB_RESOURCES)[number]["path"];

export const ASVAB_SERVICE_RESOURCE_PATHS: Record<string, readonly AsvabResourcePath[]> = {
  "1-on-1-tutoring": ["/asvab-tutor", "/asvab-study-guide"],
  "group-tutoring": ["/asvab-prep-classes", "/asvab-study-guide"],
  "self-study": ["/asvab-study-guide", "/asvab-math-practice-test"],
};
