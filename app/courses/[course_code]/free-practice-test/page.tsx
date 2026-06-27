import { Metadata } from "next";
import { notFound } from "next/navigation";
import FreeTest from "@/components/free-test/FreeTest";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import { freePracticeTestMetadata } from "@/lib/page-metadata";
import {
  fetchAllPackageDetailsForCourse,
  fetchFreePracticeTestByCode,
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

  const [freeTestData, packagesByService] = await Promise.all([
    fetchFreePracticeTestByCode(course_code),
    fetchAllPackageDetailsForCourse(course_code),
  ]);

  if (!freeTestData?.data) {
    notFound();
  }

  return (
    <FreeTest
      courseName={freeTestData.course_name}
      courseCode={course_code}
      ft_cat_list={freeTestData.data.categories}
      ft_ques_list={freeTestData.data.questions}
      packagesByService={packagesByService}
    />
  );
}
