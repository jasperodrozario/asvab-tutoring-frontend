import { Metadata } from "next";
import PackageDetailsContent from "./PackageDetailsContent";
import { packageDetailsMetadata } from "@/lib/page-metadata";
import { fetchPackageDetails } from "@/lib/php-api";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}): Promise<Metadata> {
  const { service_type, course_code } = await params;
  return packageDetailsMetadata(service_type, course_code);
}

export default async function Page({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}) {
  const { service_type, course_code } = await params;
  const initialCourseData = await fetchPackageDetails(service_type, course_code);

  return (
    <PackageDetailsContent
      service_type={service_type}
      course_code={course_code}
      initialCourseData={initialCourseData}
    />
  );
}
