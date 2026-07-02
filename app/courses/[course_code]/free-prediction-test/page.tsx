import { Metadata } from "next";
import { notFound } from "next/navigation";
import FreePredTest from "@/components/free-prediction-test/FreePredTest";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import { freePredictionTestMetadata } from "@/lib/page-metadata";
import {
  fetchAllPackageDetailsForCourse,
  fetchFreePredTestByCode,
} from "@/lib/php-api";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  return freePredictionTestMetadata(course_code);
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

  const [predTestData, packagesByService] = await Promise.all([
    fetchFreePredTestByCode(course_code),
    fetchAllPackageDetailsForCourse(course_code),
  ]);

  if (!predTestData?.data) {
    notFound();
  }

  return (
    <FreePredTest
      courseName={predTestData.course_name}
      courseCode={course_code}
      courseId={predTestData.data.course_id}
      ft_categories={predTestData.data.categories}
      ft_ques_list={predTestData.data.questions}
      packagesByService={packagesByService}
    />
  );
}
