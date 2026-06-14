import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import { fetchCourseDetailsByCode } from "@/lib/php-api";
import FreeTest from "@/components/free-test/FreeTest";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  const courseData = await fetchCourseDetailsByCode(course_code);
  const courseName = courseData?.course_name || course_code.toUpperCase();
  
  return {
    title: `Free ${courseName} Practice Test | ASVAB Tutoring`,
    description: `Take our free online ${courseName} practice test. Distraction-free test environment with realistic questions, scoring, and step-by-step reviews.`,
  };
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
    <FreeTest
      courseName={courseData.course_name}
      courseCode={course_code}
      ft_cat_list={courseData.ft_cat_list}
      ft_ques_list={courseData.ft_ques_list}
    />
  );
}
