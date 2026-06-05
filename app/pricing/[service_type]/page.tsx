import { Metadata } from "next";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import PricingPackages from "@/components/pricing-packages/PricingPackages";
import PricingContent from "@/components/pricing-content/PricingContent";
import { ServiceType } from "@/types/Services";
import { pricingMetadata } from "@/lib/page-metadata";
import {
  fetchPricingPackages,
  fetchPricingPageContent,
} from "@/lib/php-api";
import { serviceTypeToSubmenu, type PricingSubmenu } from "@/lib/package-utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type?: string }>;
}): Promise<Metadata> {
  const { service_type } = await params;
  return pricingMetadata(service_type);
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ service_type?: string }>;
}) {
  const { service_type } = await params;

  const serviceType: ServiceType | null =
    service_type === "1-on-1-tutoring" ||
    service_type === "group-tutoring" ||
    service_type === "self-study"
      ? service_type
      : null;

  if (!serviceType) {
    return (
      <p className="text-center mt-5">
        Please select a pricing section (1-on-1-tutoring / group-tutoring /
        self-study).
      </p>
    );
  }

  const title = ((type: ServiceType) => {
    switch (type) {
      case "1-on-1-tutoring":
        return "1-on-1 Tutoring";
      case "group-tutoring":
        return "Group Tutoring";
      case "self-study":
        return "Subscription";
      default:
        return "Unknown";
    }
  })(serviceType);

  const submenu: PricingSubmenu = serviceTypeToSubmenu(serviceType);

  const [packages, pricingItems] = await Promise.all([
    fetchPricingPackages(submenu),
    fetchPricingPageContent(submenu),
  ]);

  return (
    <section>
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded-bottom flex flex-col items-center text-center">
        <h1 className="text-white mb-2 text-3xl fw-bold">{title}</h1>
        <Breadcrumb
          segments={["pricing", title]}
          dynamicTitle={title}
          className="text-white text-base mt-1"
        />
      </div>

      <PricingPackages submenu={submenu} initialPackages={packages} />
      <PricingContent submenu={submenu} initialItems={pricingItems} />
    </section>
  );
}
