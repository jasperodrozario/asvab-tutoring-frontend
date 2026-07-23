import type { Metadata } from "next";
import { fetchRegistrationCourseList } from "@/lib/php-api";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account | ASVAB Tutoring",
  description:
    "Register to get access to your course and study materials at ASVAB Tutoring.",
};

export const revalidate = 3600;

export default async function RegisterPage() {
  const { courses, services } = await fetchRegistrationCourseList();

  return (
    <RegisterForm initialCourses={courses} initialServices={services} />
  );
}
