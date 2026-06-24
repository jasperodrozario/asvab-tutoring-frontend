"use client";

import { useState } from "react";
import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import FreePracticeTestsContent from "./FreePracticeTestsContent";
import type { FreePracticeTestCourse } from "@/lib/php-api";
import type { PackagesByService } from "@/lib/package-types";

type Props = {
  courses: FreePracticeTestCourse[];
  packagesByCourse: Record<string, PackagesByService>;
};

function getDefaultCourseCode(courses: FreePracticeTestCourse[]): string {
  return (
    courses.find((c) => c.courseCode === "asvab")?.courseCode ??
    courses[0]?.courseCode ??
    ""
  );
}

export default function FreePracticeTestsLayout({
  courses,
  packagesByCourse,
}: Props) {
  const [selectedCourseCode, setSelectedCourseCode] = useState(() =>
    getDefaultCourseCode(courses),
  );

  const packagesByService = packagesByCourse[selectedCourseCode];

  if (courses.length === 0) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <FreePracticeTestsContent courses={courses} />
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <FreePracticeTestsContent
          courses={courses}
          selectedCourseCode={selectedCourseCode}
          onSelectCourse={setSelectedCourseCode}
        />
      </div>
      <div className="col-lg-4 align-self-start">
        {packagesByService && selectedCourseCode && (
          <CoursePricingPanel
            courseCode={selectedCourseCode}
            packagesByService={packagesByService}
          />
        )}
      </div>
    </div>
  );
}
