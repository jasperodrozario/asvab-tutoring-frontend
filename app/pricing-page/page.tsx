import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import PricingPackages from "@/components/specific-packages/specificPackages";

// ✅ Type for pricing page content
type PricingPageItem = {
  pricing_id: string;
  title: string;
  description: string;
  is_online: string;
  closing_content: string;
  tutoring_type: string;
};

// ✅ Decode HTML entities
function decodeHtmlEntitiesServer(input: string): string {
  if (!input) return "";
  const entityMap: Record<string, string> = {
    lt: "<",
    gt: ">",
    amp: "&",
    quot: '"',
    apos: "'",
    nbsp: "\u00A0",
    ndash: "–",
    mdash: "—",
    rsquo: "’",
    lsquo: "‘",
    ldquo: "“",
    rdquo: "”",
    hellip: "…",
    copy: "©",
    reg: "®",
  };

  const entityRegex = /&(#x[0-9A-Fa-f]+|#\d+|[a-zA-Z]+);/g;
  let decoded = input;
  let prev = null;

  do {
    prev = decoded;
    decoded = decoded.replace(entityRegex, (_match, group) => {
      if (!group) return _match;
      if (group[0] === "#") {
        const code =
          group[1] === "x" || group[1] === "X"
            ? parseInt(group.slice(2), 16)
            : parseInt(group.slice(1), 10);
        return isNaN(code) ? _match : String.fromCharCode(code);
      }
      return entityMap[group] ?? _match;
    });
  } while (decoded !== prev);

  return decoded;
}

// ✅ Process HTML for rendering
function processHtmlForRendering(htmlString: string): string {
  return decodeHtmlEntitiesServer(htmlString).trim();
}

// ✅ Fetch pricing page data
async function fetchPricingPageData(submenu: string): Promise<PricingPageItem[]> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "specific-get-pricing-page-content",
          submenu: submenu,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (data?.isSuccess && Array.isArray(data.data)) {
      return data.data as PricingPageItem[];
    }

    console.warn("Unexpected data format:", data);
    return [];
  } catch (error) {
    console.error("Failed to fetch Pricing page content:", error);
    return [];
  }
}

// ✅ Required for dynamic fetching in Next.js
export const dynamic = "force-dynamic";

// ✅ Remove the old problematic type and just use `any` for searchParams
export default async function PricingPage({ searchParams }: { searchParams?: any }) {
  const submenu = (searchParams?.submenu as string) || undefined;

  if (!submenu)
    return <p className="text-center mt-5">Please select a tutoring type.</p>;

  const pricingItems = await fetchPricingPageData(submenu);

  return (
    <section>
      {/* 🔹 Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded text-center">
        <h1 className="text-white mb-2 text-3xl fw-bold">
          {submenu === "one" ? "1-on-1 Tutoring" : "Group Tutoring"}
        </h1>
        <Breadcrumb
          segments={["pricing", submenu]}
          dynamicTitle={submenu === "one" ? "1-on-1 Tutoring" : "Group Tutoring"}
          className="text-white text-base mt-1"
        />
      </div>

      {/* 🔹 Content */}
      <div className="container pb-5 py-5">
        {pricingItems.length > 0 ? (
          pricingItems.map((item) => (
            <div key={item.pricing_id} className="mb-5">
              <h2 className="text-dark mb-3">{item.title}</h2>
              <hr className="mb-4 mt-2" />
              <div
                className="text-secondary mb-3"
                dangerouslySetInnerHTML={{
                  __html: processHtmlForRendering(item.description),
                }}
              />
              {item.closing_content && (
                <div
                  className="text-muted"
                  dangerouslySetInnerHTML={{
                    __html: processHtmlForRendering(item.closing_content),
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-muted text-center">
            No pricing information available at the moment.
          </p>
        )}
      </div>

      {/* 🔹 Bottom Packages */}
      <PricingPackages />
    </section>
  );
}
