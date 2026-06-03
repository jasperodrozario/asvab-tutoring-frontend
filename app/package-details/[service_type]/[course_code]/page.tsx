import { Metadata } from "next";
import PackageDetailsContent from "./PackageDetailsContent";
import { packageDetailsMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}): Promise<Metadata> {
  const { service_type, course_code } = await params;
  return packageDetailsMetadata(service_type, course_code);
}

export default function Page({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}) {
  return <PackageDetailsContent params={params} />;
}
