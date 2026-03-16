// app/pricing-page/page.tsx
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import PricingPackages from "@/components/specific-packages/specificPackages";
import PricingContent from "@/components/pricing-content/PricingContent";

type Submenu = "one" | "group" | "subscribe";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ submenu?: string }>;
}) {
  // ✅ MUST await searchParams in new Next.js
  const params = await searchParams;

  const submenu: Submenu | null =
    params.submenu === "one" ||
    params.submenu === "group" ||
    params.submenu === "subscribe"
      ? params.submenu
      : null;

  if (!submenu) {
    return (
      <p className="text-center mt-5">
        Please select a pricing section (one / group / subscribe).
      </p>
    );
  }

  const titleMap: Record<Submenu, string> = {
    one: "1-on-1 Tutoring",
    group: "Group Tutoring",
    subscribe: "Subscribe",
  };

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded text-center">
        <h1 className="text-white mb-2 text-3xl fw-bold">
          {titleMap[submenu]}
        </h1>
        <Breadcrumb
          segments={["pricing", submenu]}
          dynamicTitle={titleMap[submenu]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Already working client fetch */}
      <PricingPackages submenu={submenu} />

      {/* ✅ FIXED pricing content (client-side fetch) */}
      <PricingContent submenu={submenu} />
    </section>
  );
}
