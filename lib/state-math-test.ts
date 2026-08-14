export const STATE_MATH_TEST_PREP_COURSE_CODE = "state-math-test-prep";
export const STATE_MATH_TEST_PREP_COURSE_ID = "60";
export const STATE_MATH_TEST_PREP_PRODUCT = "State Math Test Prep";

export type StateMathGradeOption = {
  course_id: string;
  course_name: string;
};

export type StateTestPreparationCourseRow = {
  course_id?: string | number;
  course_name?: string;
  is_online?: string | number | boolean;
};

export function isOnlineStateMathCourse(value: unknown): boolean {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "y" || normalized === "1" || normalized === "true";
}

export function isStateMathTestPrepCheckoutCourse(
  courseIdOrCode: string,
): boolean {
  const normalized = courseIdOrCode.replace(/-tutor$/i, "").toLowerCase();
  return (
    normalized === STATE_MATH_TEST_PREP_COURSE_CODE ||
    normalized === STATE_MATH_TEST_PREP_COURSE_ID
  );
}

export function isStateMathTestPrepProduct(product: string): boolean {
  const normalized = product.trim().toLowerCase();
  return (
    normalized === STATE_MATH_TEST_PREP_PRODUCT.toLowerCase() ||
    normalized === STATE_MATH_TEST_PREP_COURSE_CODE
  );
}

export function toStateMathGradeOptions(
  rows: readonly StateTestPreparationCourseRow[] | null | undefined,
): StateMathGradeOption[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    if (!isOnlineStateMathCourse(row.is_online)) return [];
    const course_id = String(row.course_id ?? "").trim();
    const course_name = String(row.course_name ?? "").trim();
    if (!course_id || !course_name) return [];
    return [{ course_id, course_name }];
  });
}
