import { Metadata } from "next";
import CourseDetailPageWrapper from "./CourseDetailPage";
import { courseMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  return courseMetadata(course_code);
}

export default function Page() {
  return <CourseDetailPageWrapper />;
}
