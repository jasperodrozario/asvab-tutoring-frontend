import { Metadata } from "next";
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
  const courseData = await fetchCourseDetailsByCode(course_code);

  return (
    <CourseDetailPageWrapper
      courseCode={course_code}
      courseData={courseData}
      breadcrumbSegments={["courses", course_code]}
      getRelatedCourseHref={(course) =>
        `/courses/${encodeURIComponent(course.course_code)}`
      }
    />
  );
}
