import { Metadata } from "next";
import CourseDetailPageWrapper from "@/app/courses/[course_code]/CourseDetailPage";
import { onlineCourseMetadata } from "@/lib/page-metadata";
import { fetchCourseDetailsByCode } from "@/lib/php-api";

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
  const courseData = await fetchCourseDetailsByCode(normalizedCode);

  return (
    <CourseDetailPageWrapper
      courseCode={normalizedCode}
      courseData={courseData}
      location={city}
      breadcrumbSegments={["online-courses", city, course_code]}
      relatedCourseLinkVariant="online"
      onlineCourseCity={city}
    />
  );
}
