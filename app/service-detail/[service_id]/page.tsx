import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import ServiceDetailContent from "@/components/service-detail/ServiceDetailContent";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service_id: string }>;
}) {
  // ✅ Next.js new requirement
  const { service_id } = await params;

  return (
    <section className="py-4">
      {/* Banner (title will come from client component) */}
      <ServiceDetailContent serviceId={service_id} />
    </section>
  );
}
