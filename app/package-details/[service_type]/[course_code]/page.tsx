import { Metadata } from "next";
import PackageDetailsContent from "./PackageDetailsContent";

// ── SEO metadata lookup: [service_type][course_code] ─────────────────────────
const packageMeta: Record<
  string,
  Record<string, { title: string; description: string }>
> = {
  "1-on-1-tutoring": {
    asvab: {
      title: "1-on-1 Tutoring Sessions Price for ASVAB Test Prep",
      description:
        "Explore our affordable rates for 1-on-1 ASVAB tutoring sessions. Achieve your best score with customized support from experienced tutors.",
    },
    afoqt: {
      title: "1-on-1 Tutoring Sessions Price for AFOQT Test Prep",
      description:
        "Explore our affordable 1-on-1 tutoring sessions for AFOQT test preparation. Get expert help tailored to your needs and boost your scores.",
    },
    sift: {
      title: "1-on-1 Tutoring Sessions Price for SIFT Test Prep",
      description:
        "Get expert 1-on-1 tutoring for SIFT Test Prep at great prices. Enhance your skills and boost your confidence with personalized guidance.",
    },
    astb: {
      title: "1-on-1 Tutoring Sessions Price for ASTB Test Prep",
      description:
        "Discover competitive pricing for personalized 1-on-1 tutoring sessions focused on ASTB test preparation. Achieve your goals with expert guidance.",
    },
    oar: {
      title: "1-on-1 Tutoring Sessions Price for OAR Test Prep",
      description:
        "Get the best value for 1-on-1 tutoring sessions designed for OAR test prep. Unlock your potential with customized learning strategies.",
    },
  },
  "group-tutoring": {
    asvab: {
      title: "Group Tutoring Sessions Price for ASVAB Test Prep",
      description:
        "Join our group tutoring sessions for ASVAB test prep at competitive prices. Enhance your skills and confidence with personalized support. Sign up now!",
    },
    afoqt: {
      title: "Group Tutoring Sessions Price for AFOQT Test Prep",
      description:
        "Explore our group tutoring options for AFOQT test preparation. Get expert help at a great price and improve your chances of success!",
    },
    sift: {
      title: "Group Tutoring Sessions Price for SIFT Test Prep",
      description:
        "Achieve success in SIFT Test Prep with our group tutoring sessions. Affordable rates and expert guidance make learning effective and enjoyable.",
    },
    astb: {
      title: "Group Tutoring Sessions Price for ASTB Test Prep",
      description:
        "Maximize your test prep success with our affordable group tutoring for ASTB. Join us for expert-led sessions that make learning effective!",
    },
    oar: {
      title: "Group Tutoring Sessions Price for OAR Test Prep",
      description:
        "Discover affordable group tutoring sessions for OAR Test Prep. Boost your scores with expert guidance and collaborative learning today!",
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}): Promise<Metadata> {
  const { service_type, course_code } = await params;
  const meta = packageMeta[service_type]?.[course_code.toLowerCase()];

  if (!meta) {
    return {
      title: "Package Details | ASVAB Tutoring",
      description:
        "Browse our tutoring packages and find the right plan for your military exam preparation.",
    };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function Page({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}) {
  return <PackageDetailsContent params={params} />;
}
