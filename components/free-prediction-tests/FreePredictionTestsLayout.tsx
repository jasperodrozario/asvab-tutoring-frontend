"use client";

import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import FreePredictionTestsContent from "./FreePredictionTestsContent";
import type { FreePredTestCourse, NavCourse } from "@/lib/php-api";
import type { PackagesByService } from "@/lib/package-types";

type Props = {
  courses: FreePredTestCourse[];
  allCourses: NavCourse[];
  packagesByCourse: Record<string, PackagesByService>;
  showMoreTestsComingSoon?: boolean;
};

function toPricingCourseOption(course: NavCourse) {
  return {
    courseCode: course.course_code,
    courseName:
    course.name,
  };
}

export default function FreePredictionTestsLayout({
  courses,
  allCourses,
  packagesByCourse,
  showMoreTestsComingSoon = false,
}: Props) {
  if (courses.length === 0) {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <FreePredictionTestsContent
            courses={courses}
            showMoreTestsComingSoon={showMoreTestsComingSoon}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <FreePredictionTestsContent
          courses={courses}
          showMoreTestsComingSoon={showMoreTestsComingSoon}
        />
      </div>
      <div className="col-lg-4 align-self-start">
        <CoursePricingPanel
          courseOptions={allCourses.map(toPricingCourseOption)}
          packagesByCourse={packagesByCourse}
        />
      </div>
    </div>
  );
}
