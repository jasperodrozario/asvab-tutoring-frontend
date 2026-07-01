"use client";

import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import FreePredictionTestsContent from "./FreePredictionTestsContent";
import type { FreePredTestCourse } from "@/lib/php-api";
import type { PackagesByService } from "@/lib/package-types";

type Props = {
  courses: FreePredTestCourse[];
  packagesByCourse: Record<string, PackagesByService>;
};

export default function FreePredictionTestsLayout({
  courses,
  packagesByCourse,
}: Props) {
  if (courses.length === 0) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <FreePredictionTestsContent courses={courses} />
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <FreePredictionTestsContent courses={courses} />
      </div>
      <div className="col-lg-4 align-self-start">
        <CoursePricingPanel
          courseOptions={courses.map((course) => ({
            courseCode: course.courseCode,
            courseName: course.courseName,
          }))}
          packagesByCourse={packagesByCourse}
        />
      </div>
    </div>
  );
}
