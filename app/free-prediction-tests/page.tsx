import type { Metadata } from "next";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import FreePredictionTestsLayout from "@/components/free-prediction-tests/FreePredictionTestsLayout";
import { freePredictionTestsMetadata } from "@/lib/page-metadata";
import {
  fetchAllPackageDetailsForCourse,
  fetchFreePredTestCatalog,
} from "@/lib/php-api";

export const metadata: Metadata = freePredictionTestsMetadata();
export const revalidate = 3600;

export default async function FreePredictionTestsPage() {
  const courses = await fetchFreePredTestCatalog();

  const packageEntries = await Promise.all(
    courses.map(async (course) => {
      const packages = await fetchAllPackageDetailsForCourse(course.courseCode);
      return [course.courseCode, packages] as const;
    }),
  );

  const packagesByCourse = Object.fromEntries(packageEntries);

  return (
    <>
      <div className="page-title-area text-white py-5">
        <div className="container text-center">
          <h1>Free Prediction Tests</h1>
          <h2 className="h4">
            Estimate your ASVAB, AFOQT, SIFT, ASTB, and OAR exam scores with free
            online prediction tests — no signup required.
          </h2>
          <Breadcrumb segments={["free-prediction-tests"]} />
        </div>
      </div>

      <div className="container py-5">
        <FreePredictionTestsLayout
          courses={courses}
          packagesByCourse={packagesByCourse}
        />
      </div>
    </>
  );
}
