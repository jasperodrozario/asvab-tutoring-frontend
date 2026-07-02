import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import CourseDetailPageWrapper from "./CourseDetailPage";
import { courseMetadata } from "@/lib/page-metadata";
import {
  fetchCourseDetailsByCode,
  fetchCourseOverviewVideoByCode,
  fetchAllPackageDetailsForCourse,
  fetchFreePredTestByCode,
  fetchFreePracticeTestByCode,
} from "@/lib/php-api";
import { isFreePredTestReady } from "@/lib/prediction-test-types";
import { isFreeTestReady } from "@/lib/course-types";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  return courseMetadata(course_code);
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_code: string }>;
}) {
  const { course_code } = await params;

  if (!isKnownCourseCode(course_code)) {
    notFound();
  }

  const [courseData, packagesByService, predTestData, freeTestData] =
    await Promise.all([
      fetchCourseDetailsByCode(course_code),
      fetchAllPackageDetailsForCourse(course_code),
      fetchFreePredTestByCode(course_code),
      fetchFreePracticeTestByCode(course_code),
    ]);

  const courseOverviewVideoData =
    await fetchCourseOverviewVideoByCode(course_code);

  const hasFreePredTest = isFreePredTestReady(
    predTestData?.data?.categories,
    predTestData?.data?.questions,
  );

  const hasFreePracticeTest = isFreeTestReady(
    freeTestData?.data?.categories,
    freeTestData?.data?.questions,
  );

  if (!courseData) {
    notFound();
  }

  return (
    <CourseDetailPageWrapper
      courseCode={course_code}
      courseData={courseData}
      courseOverviewVideoData={courseOverviewVideoData}
      packagesByService={packagesByService}
      breadcrumbSegments={["courses", course_code]}
      hasFreePredTest={hasFreePredTest}
      hasFreePracticeTest={hasFreePracticeTest}
    />
  );
}
