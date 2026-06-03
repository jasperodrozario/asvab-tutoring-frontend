import { Metadata } from "next";
import ServiceDetailContent from "@/components/services/ServiceDetailContent";
import { serviceMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string }>;
}): Promise<Metadata> {
  const { service_type } = await params;
  return serviceMetadata(service_type);
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service_type: string }>;
}) {
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
      <ServiceDetailContent serviceId={service_id} serviceType={service_type} />
    </section>
  );
}
