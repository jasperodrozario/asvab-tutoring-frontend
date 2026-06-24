"use client";

import Link from "next/link";
import type { FreePracticeTestCourse } from "@/lib/php-api";
import styles from "./freePracticeTests.module.css";

function resolveImageUrl(path?: string): string {
  if (!path) return "/images/asvab-courses-d.jpg";

  const cleaned = path.trim();

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return `${process.env.NEXT_PUBLIC_RESOURCES_URL}/${encodeURI(cleaned)}`;
}

function formatSectionNames(names: string[]): string {
  if (names.length <= 4) return names.join(", ");
  return `${names.slice(0, 4).join(", ")}, +${names.length - 4} more`;
}

type Props = {
  courses: FreePracticeTestCourse[];
  selectedCourseCode?: string;
  onSelectCourse?: (courseCode: string) => void;
};

export default function FreePracticeTestsContent({
  courses,
  selectedCourseCode,
  onSelectCourse,
}: Props) {
  if (courses.length === 0) {
    return (
      <div className={`text-center py-5 ${styles.emptyState}`}>
        <div className="alert alert-info border-0 shadow-sm">
          <h2 className="h5">No Free Practice Tests Available</h2>
          <p className="mb-3 small">
            We are updating our practice test questions. Please check back soon.
          </p>
          <Link href="/contact-us" className="btn btn-primary-custom">
            Contact Us
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className={styles.intro}>
        Prepare for your military career with our free online practice tests.
        Choose an exam below to evaluate your knowledge — no signup required.
      </p>

      <h2 className={`h4 ${styles.sectionHeading}`}>Available Practice Tests</h2>

      <div className="d-flex flex-column gap-4">
        {courses.map((course) => {
          const testHref = `/courses/${encodeURIComponent(course.courseCode)}/free-practice-test`;
          const overviewHref = `/courses/${encodeURIComponent(course.courseCode)}`;

          return (
            <article
              key={course.courseCode}
              id={course.courseCode}
              className={`card border-0 shadow-sm overflow-hidden ${styles.courseCard} ${
                selectedCourseCode === course.courseCode
                  ? styles.courseCardSelected
                  : ""
              }`}
              onClick={() => onSelectCourse?.(course.courseCode)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCourse?.(course.courseCode);
                }
              }}
              role={onSelectCourse ? "button" : undefined}
              tabIndex={onSelectCourse ? 0 : undefined}
            >
              <div className="row g-0 align-items-stretch">
                <div className="col-md-4">
                  <img
                    src={resolveImageUrl(course.imageSrc)}
                    alt={course.courseName}
                    className={`w-100 h-100 ${styles.courseCardImg}`}
                    width={300}
                    height={180}
                  />
                </div>
                <div className="col-md-8">
                  <div className="card-body d-flex flex-column h-100 p-4">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <h3 className="h5 fw-bold mb-0" style={{ color: "#002341" }}>
                        {course.courseName}
                      </h3>
                      <span
                        className={`badge rounded-pill px-3 py-1 ${styles.sectionBadge}`}
                      >
                        {course.sectionCount}{" "}
                        {course.sectionCount === 1 ? "section" : "sections"}
                      </span>
                    </div>
                    {course.fullForm && (
                      <p className="small text-muted mb-2">{course.fullForm}</p>
                    )}
                    <p className={`mb-3 ${styles.sectionNames}`}>
                      Sections: {formatSectionNames(course.sectionNames)}
                    </p>
                    <div className="mt-auto d-flex flex-wrap gap-2">
                      <Link
                        href={testHref}
                        className="btn btn-primary-custom px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Take {course.courseName} Test
                      </Link>
                      <Link
                        href={overviewHref}
                        className="btn btn-secondary-custom px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Course Overview
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
