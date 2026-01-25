// app/pricing-page/page.tsx
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import PricingPackages from "@/components/specific-packages/specificPackages";

type Submenu = "one" | "group" | "subscribe";

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ submenu?: string }>;
}) {
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

  // UI titles (what users should see)
  const titleMap: Record<Submenu, string> = {
    one: "1-on-1 Tutoring",
    group: "Group Tutoring",
    subscribe: "Self Study", // ✅ show Self Study, not Subscribe
  };

  // UI breadcrumb slug (what breadcrumb uses in URL/label)
  const breadcrumbSlugMap: Record<Submenu, string> = {
    one: "one",
    group: "group",
    subscribe: "self-study", // ✅ show self-study in breadcrumb
  };

  const breadcrumbSegments = ["pricing", breadcrumbSlugMap[submenu]];

  return (
    <section>
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded text-center">
        <h1 className="text-white mb-2 text-3xl fw-bold">
          {titleMap[submenu]}
        </h1>

        <Breadcrumb
          segments={breadcrumbSegments}
          dynamicTitle={titleMap[submenu]} // last crumb label
          className="text-white text-base mt-1"
        />
      </div>

      {/* API still receives submenu=subscribe */}
      <PricingPackages submenu={submenu} />
    </section>
  );
}
