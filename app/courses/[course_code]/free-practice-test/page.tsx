import { Metadata } from "next";
import { notFound } from "next/navigation";
import FreeTest from "@/components/free-test/FreeTest";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import { freePracticeTestMetadata } from "@/lib/page-metadata";
import {
  fetchAllPackageDetailsForCourse,
  fetchCourseDetailsByCode,
} from "@/lib/php-api";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  return freePracticeTestMetadata(course_code);
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

  const [courseData, packagesByService] = await Promise.all([
    fetchCourseDetailsByCode(course_code),
    fetchAllPackageDetailsForCourse(course_code),
  ]);

  if (!courseData) {
    notFound();
  }

  return (
    <FreeTest
      courseName={courseData.course_name}
      courseCode={course_code}
      ft_cat_list={courseData.ft_cat_list}
      ft_ques_list={courseData.ft_ques_list}
      packagesByService={packagesByService}
    />
  );
}
