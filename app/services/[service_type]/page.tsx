import { Metadata } from "next";
import ServiceDetailView from "./ServiceDetailView";
import { serviceMetadata } from "@/lib/page-metadata";
import { fetchServiceDetail } from "@/lib/php-api";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type: string }>;
}): Promise<Metadata> {
  const { service_type } = await params;
  return serviceMetadata(service_type);
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
  const service_id = getServiceId(service_type);
  const data = await fetchServiceDetail(service_id);

  if (!data) {
    return (
      <section className="pb-4">
        <div className="container py-5 text-center">
          <h3>Service details not found.</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-4">
      <ServiceDetailView data={data} serviceType={service_type} />
    </section>
  );
}
