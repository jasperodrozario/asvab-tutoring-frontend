// import React from "react";
// import TopCourses from "@/components/topcourses/Topcourses";
// import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import { Metadata } from "next";

// export const metadata = {
//   title: "Services | ASVAB Tutoring",
//   description:
//     "Explore the wide range of ASVAB Tutoring services and courses we offer to help you prepare effectively.",
// };

// export default function ServicesPage() {
//   return (
//     <section className="bg-light pb-5 min-h-screen">
//       {/* ✅ Banner with title + breadcrumb */}
//       <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
//         <h1 className="text-white mb-2 text-3xl font-bold">Our Services</h1>
//         <Breadcrumb segments={["services"]} className="text-white text-base mt-1" />
//       </div>

//       {/* ✅ Reuse TopCourses component */}
//       <main>
//         <TopCourses />
//       </main>
//     </section>
//   );
// }

import ServiceDetailContent from "@/components/services/ServiceDetailContent";
import HotDealBanner from "@/components/promotions/HotDealBanner";

export const dynamic = "force-dynamic";

// ── Per-service SEO metadata ───────────────────────────────────────────────────
const serviceMeta: Record<string, { title: string; description: string }> = {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string }>;
}): Promise<Metadata> {
  const { service_type } = await params;
  const meta = serviceMeta[service_type];

  if (!meta) {
    return {
      title: "Services | ASVAB Tutoring",
      description:
        "Explore the range of tutoring services offered by ASVAB Tutoring to help you succeed on your military exam.",
    };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service_type: string }>;
}) {
  // ✅ Next.js new requirement
  const { service_type } = await params;

  const getServiceId = (serviceType: string) => {
    switch (serviceType) {
      case "1-on-1-tutoring":
        return "2";
      case "group-tutoring":
        return "3";
      case "self-study":
        return "4";
      default:
        return "1";
    }
  };

  const service_id = getServiceId(service_type);

  return (
    <section className="pb-4">
      {/* Banner (title will come from client component) */}
      <ServiceDetailContent serviceId={service_id} serviceType={service_type} />
    </section>
  );
}
