import { Metadata } from "next";
import { freePracticeTestMetadata } from "@/lib/page-metadata";
import FreePracticeTestPageContent from "./FreePracticeTestPageContent";

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
  return <FreePracticeTestPageContent courseCode={course_code} />;
}
