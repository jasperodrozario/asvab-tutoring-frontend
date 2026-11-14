"use client";

import Link from "next/link";
import freeTestStyles from "./freeTest.module.css";
import { getFreePracticeTestSubjectHref } from "@/lib/free-practice-test-routes";

type SubjectSwitcherProps = {
  categoryNames: string[];
  activeCategory: number;
  questionCounts: number[];
  answeredCounts: number[];
  submittedCategories: boolean[];
  onSelectCategory: (index: number) => void;
  courseCode: string;
};

export default function SubjectSwitcher({
  categoryNames,
  activeCategory,
  questionCounts,
  answeredCounts,
  submittedCategories,
  onSelectCategory,
  courseCode,
}: SubjectSwitcherProps) {
  return (
    <nav
      className={freeTestStyles.subjectSwitcher}
      aria-label="Practice subjects"
    >
      <div className={freeTestStyles.subjectSwitcherHeader}>
        <i className="bi bi-grid-1x2-fill" aria-hidden="true" />
        <div>
          <h2>Practice subjects</h2>
          <p>Switch to a different subject.</p>
        </div>
      </div>

      <div className={freeTestStyles.subjectSwitcherList}>
        {categoryNames.map((name, index) => {
          const isActive = index === activeCategory;
          const isSubmitted = submittedCategories[index];
          const answered = answeredCounts[index] ?? 0;
          const total = questionCounts[index] ?? 0;

          return (
            <Link
              key={name}
              href={getFreePracticeTestSubjectHref(courseCode, name)}
              scroll={false}
              className={`${freeTestStyles.subjectSwitcherButton} ${
                isActive ? freeTestStyles.subjectSwitcherButtonActive : ""
              }`}
              onClick={() => onSelectCategory(index)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={freeTestStyles.subjectSwitcherButtonText}>
                <strong>{name}</strong>
                <small>
                  {isSubmitted ? "Completed" : `${answered}/${total} answered`}
                </small>
              </span>
              <i
                className={`bi ${
                  isSubmitted
                    ? "bi-check-circle-fill"
                    : isActive
                      ? "bi-arrow-right-circle-fill"
                      : "bi-chevron-right"
                }`}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
