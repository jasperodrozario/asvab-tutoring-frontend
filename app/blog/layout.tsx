import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | ASVAB Tutoring",
  description:
    "Read the latest tips, tricks, and updates on ASVAB, ASTB, OAR, AFOQT, and SIFT tests from expert tutors.",
  openGraph: {
    title: "ASVAB Tutoring Blog",
    description:
      "Expert advice and study guides for military entrance exams including ASVAB, ASTB, OAR, AFOQT, and SIFT.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
