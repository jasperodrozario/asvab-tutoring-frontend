import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export type PageSeo = {
  title: string;
  description: string;
};

/** Homepage & root layout defaults (existing copy). */
export const HOME_SEO: PageSeo = {
  title: "ASVAB Tutoring: ASVAB Tutor, ASTB, OAR, AFOQT, SIFT",
  description:
    "ASVAB Tutoring provides best one-on-one online tutoring for ASVAB, ASTB, OAR & AFOQT exams. Expert tutors, personalized lessons, and proven strategies to boost your test scores.",
};

export const ABOUT_US_SEO: PageSeo = {
  title: "About Us - ASVAB Tutoring",
  description:
    "ASVAB Tutoring helps students prepare for the ASVAB, AFOQT, SIFT, and OAR exams with expert guidance, personalized lessons, and proven test strategies.",
};

export const FAQ_SEO: PageSeo = {
  title: "FAQ | ASVAB Tutoring",
  description:
    "Find answers to frequently asked questions about ASVAB Tutoring’s services, pricing, and features.",
};

export const SITEMAP_SEO: PageSeo = {
  title: "Sitemap | ASVAB Tutoring",
  description:
    "Browse all ASVAB Tutoring pages including courses, services, pricing, packages, and blog articles.",
};

export const OUR_MOBILE_APPS_SEO: PageSeo = {
  title: "Best Study Apps for ASVAB , AFOQT , SIFT , ASTB , OAR",
  description:
    "Best study apps for ASVAB, AFOQT, SIFT, ASTB, and OAR prep. Practice tests, flashcards, video lessons, score predictors, and expert tutoring.",
};

export const BLOG_SEO: PageSeo = {
  title: "Blog | ASVAB Tutoring",
  description:
    "Read the latest tips, tricks, and updates on ASVAB, ASTB, OAR, AFOQT, and SIFT tests from expert tutors.",
};

/** New page-specific metadata (previously inherited root defaults). */
export const HOW_IT_WORKS_SEO: PageSeo = {
  title: "How It Works | ASVAB Tutoring",
  description:
    "See how ASVAB Tutoring works—from choosing your exam and service to enrolling in 1-on-1, group, or self-study prep. Start your military test prep journey today.",
};

export const OUR_TUTORS_SEO: PageSeo = {
  title: "Our Tutors | ASVAB Tutoring",
  description:
    "Meet ASVAB Tutoring's experienced instructors specializing in ASVAB, AFOQT, ASTB, OAR, and SIFT prep. Learn from experts dedicated to your exam success.",
};

export const PRIVACY_POLICY_SEO: PageSeo = {
  title: "Privacy Policy | ASVAB Tutoring",
  description:
    "Read ASVAB Tutoring's privacy policy to understand how we collect, use, and protect your personal information when you use our tutoring services.",
};

export const TERMS_OF_SERVICE_SEO: PageSeo = {
  title: "Terms of Service | ASVAB Tutoring",
  description:
    "Review ASVAB Tutoring's terms of service covering enrollment, payments, subscriptions, cancellations, and use of our website and study materials.",
};

export const COURSE_SEO: Record<string, PageSeo> = {
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

export const COURSE_FALLBACK_SEO: PageSeo = {
  title: "Course | ASVAB Tutoring",
  description:
    "Prepare for your military exam with ASVAB Tutoring's expert-led courses and practice tests.",
};

export const SERVICE_SEO: Record<string, PageSeo> = {
  "1-on-1-tutoring": {
    title: "1-on-1 Tutoring Services for ASVAB, AFOQT, OAR, SIFT, ASTB",
    description:
      "Prepare for your military exams with dedicated 1-on-1 tutoring for ASVAB, AFOQT, OAR, SIFT, and ASTB. Get the support you need to excel!",
  },
  "group-tutoring": {
    title: "Group Tutoring Services for ASVAB, AFOQT, OAR, SIFT, ASTB",
    description:
      "Join our group tutoring sessions for ASVAB, AFOQT, OAR, SIFT, and ASTB. Benefit from collaborative learning and expert support to excel in your exams.",
  },
  "self-study": {
    title: "Self Study Course for ASVAB, AFOQT, OAR, SIFT, ASTB",
    description:
      "Prepare effectively for the ASVAB, AFOQT, OAR, SIFT, and ASTB with our tailored self-study courses. Start your journey to success in military testing now!",
  },
};

export const SERVICE_FALLBACK_SEO: PageSeo = {
  title: "Services | ASVAB Tutoring",
  description:
    "Explore the range of tutoring services offered by ASVAB Tutoring to help you succeed on your military exam.",
};

export const PRICING_SEO: Record<string, PageSeo> = {
  "1-on-1-tutoring": {
    title: "1-on-1 Tutoring Services Price for Military Entrance Test Prep",
    description:
      "Get the best value for 1-on-1 tutoring preparation for military entrance exam. Our expert tutors are here to help you succeed at competitive prices. Start your journey today!",
  },
  "group-tutoring": {
    title: "Group Tutoring Services Price for Military Entrance Test Prep",
    description:
      "Join our group tutoring sessions for Military Entrance Test prep. Achieve your military goals with experienced instructors and a supportive learning environment.",
  },
};

export const PRICING_FALLBACK_SEO: PageSeo = {
  title: "Pricing | ASVAB Tutoring",
  description:
    "View our competitive pricing for ASVAB Tutoring services. Find the right plan to help you succeed on your military entrance exam.",
};

export const PACKAGE_SEO: Record<string, Record<string, PageSeo>> = {
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

export const PACKAGE_FALLBACK_SEO: PageSeo = {
  title: "Package Details | ASVAB Tutoring",
  description:
    "Browse our tutoring packages and find the right plan for your military exam preparation.",
};

export const BLOG_DETAIL_FALLBACK_SEO: PageSeo = {
  title: "Blog Detail | ASVAB Tutoring",
  description: "Read the latest news and updates from ASVAB Tutoring.",
};

export function homeMetadata(): Metadata {
  return buildPageMetadata({ ...HOME_SEO, path: "/" });
}

export function aboutUsMetadata(): Metadata {
  return buildPageMetadata({ ...ABOUT_US_SEO, path: "/about-us" });
}

export function faqMetadata(): Metadata {
  return buildPageMetadata({ ...FAQ_SEO, path: "/faq" });
}

export function sitemapMetadata(): Metadata {
  return buildPageMetadata({ ...SITEMAP_SEO, path: "/sitemap" });
}

export function ourMobileAppsMetadata(): Metadata {
  return buildPageMetadata({ ...OUR_MOBILE_APPS_SEO, path: "/our-mobile-apps" });
}

export function blogMetadata(): Metadata {
  return buildPageMetadata({
    ...BLOG_SEO,
    path: "/blog",
    openGraph: {
      title: "ASVAB Tutoring Blog",
      description:
        "Expert advice and study guides for military entrance exams including ASVAB, ASTB, OAR, AFOQT, and SIFT.",
      type: "website",
    },
  });
}

export function howItWorksMetadata(): Metadata {
  return buildPageMetadata({ ...HOW_IT_WORKS_SEO, path: "/how-it-works" });
}

export function ourTutorsMetadata(): Metadata {
  return buildPageMetadata({ ...OUR_TUTORS_SEO, path: "/our-tutors" });
}

export function privacyPolicyMetadata(): Metadata {
  return buildPageMetadata({ ...PRIVACY_POLICY_SEO, path: "/privacy-policy" });
}

export function termsOfServiceMetadata(): Metadata {
  return buildPageMetadata({
    ...TERMS_OF_SERVICE_SEO,
    path: "/terms-of-service",
  });
}

export function courseMetadata(courseCode: string): Metadata {
  const meta = COURSE_SEO[courseCode.toLowerCase()] ?? COURSE_FALLBACK_SEO;
  const path = `/courses/${courseCode.toLowerCase()}`;

  return buildPageMetadata({ ...meta, path });
}

export function serviceMetadata(serviceType: string): Metadata {
  const meta = SERVICE_SEO[serviceType] ?? SERVICE_FALLBACK_SEO;

  return buildPageMetadata({ ...meta, path: `/services/${serviceType}` });
}

export function pricingMetadata(serviceType?: string): Metadata {
  const meta =
    serviceType && PRICING_SEO[serviceType]
      ? PRICING_SEO[serviceType]
      : PRICING_FALLBACK_SEO;
  const path = serviceType ? `/pricing/${serviceType}` : "/pricing";

  return buildPageMetadata({ ...meta, path });
}

export function packageDetailsMetadata(
  serviceType: string,
  courseCode: string,
): Metadata {
  const meta =
    PACKAGE_SEO[serviceType]?.[courseCode.toLowerCase()] ??
    PACKAGE_FALLBACK_SEO;
  const path = `/package-details/${serviceType}/${courseCode.toLowerCase()}`;

  return buildPageMetadata({ ...meta, path });
}

export function onlineCourseMetadata(
  city: string,
  courseCode: string,
  title: string,
  description: string,
): Metadata {
  const path = `/online-courses/${city}/${courseCode}`;

  return buildPageMetadata({ title, description, path });
}

export function blogDetailMetadata(
  blogId: string,
  blogTitleSlug: string,
  seo: PageSeo,
  openGraph?: Metadata["openGraph"],
): Metadata {
  const path = `/blog-detail/${blogId}/${blogTitleSlug}`;

  return buildPageMetadata({
    ...seo,
    path,
    openGraph,
  });
}
