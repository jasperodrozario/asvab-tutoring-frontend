// app/pricing/page.tsx
import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Packages from "@/components/packages/Packages";

type PricingPageItem = {
  pricing_id: string;
  title: string;
  description: string;
  is_online: string;
  closing_content: string;
};

// Decode HTML entities (same logic as How It Works)
function decodeHtmlEntitiesServer(input: string): string {
  if (!input) return input;
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

  let prev: string | null = null;
  let decoded = input;

  do {
    prev = decoded;
    decoded = decoded.replace(entityRegex, (_match, group) => {
      if (!group) return _match;

      // Numeric (hex)
      if (group[0] === "#") {
        if (group[1] === "x" || group[1] === "X") {
          const code = parseInt(group.slice(2), 16);
          return isNaN(code) ? _match : String.fromCharCode(code);
        } else {
          const code = parseInt(group.slice(1), 10);
          return isNaN(code) ? _match : String.fromCharCode(code);
        }
      }

      // Named entity
      return entityMap[group] ?? _match;
    });
  } while (decoded !== prev);

  return decoded;
}

// Convert escaped HTML string into renderable HTML
function processHtmlForRendering(htmlString: string): string {
  if (!htmlString) return "";
  const decoded = decodeHtmlEntitiesServer(htmlString);
  return decoded.trim();
}

// Fetch pricing page data
async function fetchPricingPageData(): Promise<PricingPageItem[]> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ action: "get-pricing-page-content" }),
        cache: "force-cache",
      }
    );

    const data = await response.json();
    return data?.isSuccess ? (data.data as PricingPageItem[]) : [];
  } catch (error) {
    console.error("Failed to fetch Pricing page content:", error);
    return [];
  }
}

// Force server-rendering
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricingItems = await fetchPricingPageData();

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center">
        {/* Page Title */}
        <h1 className="text-white mb-2 text-3xl font-bold">Pricing</h1>

        {/* Breadcrumb */}
        <Breadcrumb
          segments={["pricing"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container pb-5 py-5">
        {pricingItems.length > 0 ? (
          pricingItems.map((item: PricingPageItem) => {
            const descHtml = processHtmlForRendering(item.description || "");
            const closingHtml = processHtmlForRendering(
              item.closing_content || ""
            );

            return (
              <div key={item.pricing_id} className="mb-5">
                <h2 className="text-dark mb-3">{item.title}</h2>
                <hr className="mb-4 mt-2" />

                {/* Render formatted HTML */}
                <div
                  className="text-secondary mb-3"
                  dangerouslySetInnerHTML={{ __html: descHtml }}
                />

                {closingHtml && (
                  <div
                    className="text-muted"
                    dangerouslySetInnerHTML={{ __html: closingHtml }}
                  />
                )}
              </div>
            );
          })
        ) : (
          <p className="text-muted text-center">
            No pricing information available at the moment.
          </p>
        )}
      </div>

      {/* Packages at bottom */}
     <Packages showEnrollButton={false} headingSize="fs-2" />

    </section>
  );
}
