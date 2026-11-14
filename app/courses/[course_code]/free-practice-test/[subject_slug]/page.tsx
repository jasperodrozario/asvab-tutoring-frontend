import type { Metadata } from "next";
import { freePracticeTestMetadata } from "@/lib/page-metadata";
import FreePracticeTestPageContent from "../FreePracticeTestPageContent";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string; subject_slug: string }>;
}): Promise<Metadata> {
  const { course_code, subject_slug } = await params;
  return freePracticeTestMetadata(course_code, subject_slug);
}

export default async function SubjectPracticeTestPage({
  params,
}: {
  params: Promise<{ course_code: string; subject_slug: string }>;
}) {
  const { course_code, subject_slug } = await params;
  return (
    <FreePracticeTestPageContent
      courseCode={course_code}
      subjectSlug={subject_slug}
    />
  );
}
