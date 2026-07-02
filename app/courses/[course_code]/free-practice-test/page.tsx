import { Metadata } from "next";
import { notFound } from "next/navigation";
import FreeTest from "@/components/free-test/FreeTest";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import { freePracticeTestMetadata } from "@/lib/page-metadata";
import {
  fetchAllPackageDetailsForCourse,
  fetchFreePracticeTestByCode,
  fetchFreePredTestByCode,
} from "@/lib/php-api";
import { isFreePredTestReady } from "@/lib/prediction-test-types";

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

  const [freeTestData, packagesByService, predTestData] = await Promise.all([
    fetchFreePracticeTestByCode(course_code),
    fetchAllPackageDetailsForCourse(course_code),
    fetchFreePredTestByCode(course_code),
  ]);

  const hasFreePredTest = isFreePredTestReady(
    predTestData?.data?.categories,
    predTestData?.data?.questions,
  );

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
      hasFreePredTest={hasFreePredTest}
    />
  );
}
