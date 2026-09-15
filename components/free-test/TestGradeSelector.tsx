"use client";

import styles from "./freeTest.module.css";

export type TestGradeOption = {
  main_course_id: number | string;
  course_name: string;
};

type TestGradeSelectorProps = {
  options: TestGradeOption[];
  value: string;
  onChange: (mainCourseId: string) => void;
  variant: "practice" | "prediction";
};

export default function TestGradeSelector({
  options,
  value,
  onChange,
  variant,
}: TestGradeSelectorProps) {
  const testLabel = variant === "practice" ? "practice" : "prediction";

  return (
    <div className={styles.testRulesCard}>
      <div className={styles.testRulesHeader}>
        <span className={styles.testRulesIconWrap} aria-hidden>
          <i className="bi bi-mortarboard-fill" aria-hidden />
        </span>
        <h2 className={styles.testRulesTitle}>Choose your grade</h2>
      </div>
      <p className={styles.testRulesLead}>
        Each grade has its own {testLabel} test. Pick the grade you are
        preparing for — switching grades restarts the test with that
        grade&apos;s questions.
      </p>
      <div className="row g-2 align-items-center">
        <div className="col-12 col-md-6 col-lg-5">
          <label htmlFor="test-grade-select" className="form-label fw-semibold">
            Grade / Course
          </label>
          <select
            id="test-grade-select"
            className="form-select"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {options.map((option) => (
              <option
                key={String(option.main_course_id)}
                value={String(option.main_course_id)}
              >
                {option.course_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
