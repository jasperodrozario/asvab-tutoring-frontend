import { Metadata } from "next";
import CourseDetailPageClient from "./CourseDetailPageClient";

type Props = {
  params: Promise<{ city: string; course_code: string }>;
};

function formatString(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, course_code } = await params;

  const formattedCity = formatString(city);
  const formattedCourse = formatString(course_code.replace(/-tutor$/, ""));

  const title = `${formattedCourse} Tutor in ${formattedCity} | ASVAB Tutoring`;
  const description = `Looking for ${formattedCourse} Tutor in ${formattedCity}? ASVAB Tutoring provides the best ${formattedCourse} classes and tutoring in ${formattedCity}. Enroll now for expert guidance.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <CourseDetailPageClient params={resolvedParams} />;
}
