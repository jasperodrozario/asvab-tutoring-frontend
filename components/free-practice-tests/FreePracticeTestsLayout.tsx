"use client";

import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import FreePracticeTestsContent from "./FreePracticeTestsContent";
import type { FreePracticeTestCourse } from "@/lib/php-api";
import type { PackagesByService } from "@/lib/package-types";
import PredictionTestPromoCard from "@/components/prediction-test/PredictionTestPromoCard";
import styles from "./freePracticeTests.module.css";

type Props = {
  courses: FreePracticeTestCourse[];
  packagesByCourse: Record<string, PackagesByService>;
};

export default function FreePracticeTestsLayout({
  courses,
  packagesByCourse,
}: Props) {
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
        <FreePracticeTestsContent courses={courses} />
      </div>
      <div className={`col-lg-4 ${styles.pricingColumn}`}>
        <div className={styles.pricingStickyStack}>
        <CoursePricingPanel
          courseOptions={courses.map((course) => ({
            courseCode: course.courseCode,
            courseName: course.courseName,
          }))}
          packagesByCourse={packagesByCourse}
          disableSticky
        />
        <div className={styles.predictionPromo}>
          <PredictionTestPromoCard
            href="/free-prediction-tests"
            eyebrow="A next step after practice"
            title="Ready to check your overall readiness?"
            text="Practice tests build skills by subject. A prediction test brings the sections together to estimate your exam score."
            buttonLabel="Explore prediction tests"
            buttonClassName="btn-primary-custom"
            buttonIconClass="bi-arrow-right"
          />
        </div>
        </div>
      </div>
    </div>
  );
}
