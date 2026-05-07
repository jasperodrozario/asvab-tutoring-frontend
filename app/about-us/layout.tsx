import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - ASVAB Tutoring",
  description:
    "ASVAB Tutoring helps students prepare for the ASVAB, AFOQT, SIFT, and OAR exams with expert guidance, personalized lessons, and proven test strategies.",
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
