import ServiceDetailContent from "@/components/services/ServiceDetailContent";

export const dynamic = "force-dynamic";

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
    <section className="py-4">
      {/* Banner (title will come from client component) */}
      <ServiceDetailContent serviceId={service_id} />
    </section>
  );
}
