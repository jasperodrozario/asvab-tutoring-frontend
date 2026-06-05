import { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailContent from "@/components/services/ServiceDetailContent";
import { isKnownServiceType } from "@/lib/known-route-validation";

export const dynamic = "force-dynamic";

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

function getServiceId(serviceType: string) {
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
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service_type: string }>;
}) {
  const { service_type } = await params;

  if (!isKnownServiceType(service_type)) {
    notFound();
  }

  const service_id = getServiceId(service_type);

  return (
    <section className="pb-4">
      <ServiceDetailContent serviceId={service_id} serviceType={service_type} />
    </section>
  );
}
