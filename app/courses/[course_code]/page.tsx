import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import CourseDetailPageWrapper from "./CourseDetailPage";
import { courseMetadata } from "@/lib/page-metadata";
import { fetchCourseDetailsByCode } from "@/lib/php-api";

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

  const courseData = await fetchCourseDetailsByCode(course_code);

  if (!courseData) {
    notFound();
  }

  return (
    <CourseDetailPageWrapper
      courseCode={course_code}
      courseData={courseData}
      breadcrumbSegments={["courses", course_code]}
      relatedCourseLinkVariant="standard"
    />
  );
}
