export function getFreePracticeTestSubjectSlug(subjectName: string): string {
  return subjectName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getFreePracticeTestSubjectHref(
  courseCode: string,
  subjectName: string,
): string {
  return `/courses/${encodeURIComponent(courseCode)}/free-practice-test/${getFreePracticeTestSubjectSlug(subjectName)}`;
}

export function findFreePracticeTestSubjectIndex(
  subjectNames: readonly string[],
  subjectSlug?: string,
): number {
  if (!subjectSlug) return -1;
  return subjectNames.findIndex(
    (subjectName) => getFreePracticeTestSubjectSlug(subjectName) === subjectSlug,
  );
}
