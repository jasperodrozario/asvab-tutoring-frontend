import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import CourseDetailPageWrapper from "@/app/courses/[course_code]/CourseDetailPage";
import { onlineCourseMetadata } from "@/lib/page-metadata";
import {
  fetchCourseDetailsByCode,
  fetchCourseOverviewVideoByCode,
  fetchAllPackageDetailsForCourse,
  fetchFreePredTestByCode,
} from "@/lib/php-api";
import { isFreePredTestReady } from "@/lib/prediction-test-types";

type Props = {
  params: Promise<{ city: string; course_code: string }>;
};

export const revalidate = 3600;

function formatString(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, course_code } = await params;

  const formattedCity = formatString(city);
  const formattedCourse = formatString(course_code.replace(/-tutor$/, ""));

  const title = `${formattedCourse} Tutor in ${formattedCity} | ASVAB Tutoring`;
  const description = `Looking for ${formattedCourse} Tutor in ${formattedCity}? ASVAB Tutoring provides the best ${formattedCourse} classes and tutoring in ${formattedCity}. Enroll now for expert guidance.`;

  return onlineCourseMetadata(city, course_code, title, description);
}

export default async function Page({ params }: Props) {
  const { city, course_code } = await params;
  const normalizedCode = course_code.replace(/-tutor$/, "");

  if (!isKnownCourseCode(normalizedCode)) {
    notFound();
  }

  const [courseData, packagesByService, courseOverviewVideoData, predTestData] =
    await Promise.all([
      fetchCourseDetailsByCode(normalizedCode),
      fetchAllPackageDetailsForCourse(normalizedCode),
      fetchCourseOverviewVideoByCode(normalizedCode),
      fetchFreePredTestByCode(normalizedCode),
    ]);

  const hasFreePredTest = isFreePredTestReady(
    predTestData?.data?.categories,
    predTestData?.data?.questions,
  );

  if (!courseData) {
    notFound();
  }

  return (
    <CourseDetailPageWrapper
      courseCode={normalizedCode}
      courseData={courseData}
      courseOverviewVideoData={courseOverviewVideoData}
      packagesByService={packagesByService}
      location={city}
      breadcrumbSegments={["online-courses", city, course_code]}
      hasFreePredTest={hasFreePredTest}
    />
  );
}
