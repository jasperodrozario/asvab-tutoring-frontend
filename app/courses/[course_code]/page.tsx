import { Metadata } from "next";
import CourseDetailPageWrapper from "./CourseDetailPage";

// ── Per-course SEO metadata ───────────────────────────────────────────────────
const courseMeta: Record<string, { title: string; description: string }> = {
  asvab: {
    title: "ASVAB Test Prep Classes | ASVAB Courses | ASVAB Practice Test",
    description:
      "Prepare for the ASVAB with our comprehensive test prep classes and online practice tests. Boost your confidence and score higher on your exam today!",
  },
  afoqt: {
    title: "AFOQT Tutor | AFOQT Test Prep Classes | AFOQT Practice Test",
    description:
      "Get ready for the AFOQT with our expert tutors, comprehensive prep classes, and online practice tests. Boost your confidence and score high!",
  },
  sift: {
    title: "SIFT Tutor | SIFT Test Prep Classes | SIFT Practice Test",
    description:
      "Elevate your SIFT test preparation with our expert-led classes and comprehensive online practice tests. Achieve your best score with SIFT Tutor today!",
  },
  astb: {
    title: "ASTB Tutor | ASTB Test Prep Classes | ASTB Practice Test",
    description:
      "Elevate your ASTB scores with expert tutoring, comprehensive test prep classes, and online practice tests. Start your journey to success today!",
  },
  oar: {
    title: "OAR Tutor | OAR Test Prep Classes | OAR Practice Test",
    description:
      "Join our OAR test prep classes and access online practice tests designed to enhance your skills. Start your journey to success with us now.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_code: string }>;
}): Promise<Metadata> {
  const { course_code } = await params;
  const meta = courseMeta[course_code.toLowerCase()];

  if (!meta) {
    return {
      title: "Course | ASVAB Tutoring",
      description:
        "Prepare for your military exam with ASVAB Tutoring's expert-led courses and practice tests.",
    };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function Page() {
  return <CourseDetailPageWrapper />;
}
