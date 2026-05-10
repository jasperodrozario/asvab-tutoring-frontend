// app/pricing-page/page.tsx
import { Metadata } from "next";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import PricingPackages from "@/components/pricing-packages/PricingPackages";
import PricingContent from "@/components/pricing-content/PricingContent";
import HotDealBanner from "@/components/hot-deal/HotDealBanner";
import { ServiceType } from "@/types/Services";

type Submenu = "one" | "group" | "subscribe";

// ── Per-service pricing SEO metadata ─────────────────────────────────────────
const pricingMeta: Record<string, { title: string; description: string }> = {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service_type?: string }>;
}): Promise<Metadata> {
  const { service_type } = await params;
  const meta = service_type ? pricingMeta[service_type] : undefined;

  if (!meta) {
    return {
      title: "Pricing | ASVAB Tutoring",
      description:
        "View our competitive pricing for ASVAB Tutoring services. Find the right plan to help you succeed on your military entrance exam.",
    };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

// export const dynamic = "force-dynamic";
export default async function PricingPage({
  params,
}: {
  params: Promise<{ service_type?: string }>;
}) {
  // ✅ MUST await searchParams in new Next.js
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

  const title = ((serviceType: ServiceType) => {
    switch (serviceType) {
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

  const submenu: Submenu = ((serviceType) => {
    switch (serviceType) {
      case "1-on-1-tutoring":
        return "one";
      case "group-tutoring":
        return "group";
      case "self-study":
        return "subscribe";
      default:
        return "one";
    }
  })(serviceType);

  const isFeaturedDeal = serviceType === "group-tutoring";

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded-bottom flex flex-col items-center text-center">
        <h1 className="text-white mb-2 text-3xl fw-bold">{title}</h1>
        <Breadcrumb
          segments={["pricing", title]}
          dynamicTitle={title}
          className="text-white text-base mt-1"
        />
      </div>

      <div className="container mt-5">
        <HotDealBanner featured={isFeaturedDeal} />
      </div>

      {/* Already working client fetch */}
      <PricingPackages submenu={submenu} />

      {/* ✅ FIXED pricing content (client-side fetch) */}
      <PricingContent submenu={submenu} />
    </section>
  );
}
