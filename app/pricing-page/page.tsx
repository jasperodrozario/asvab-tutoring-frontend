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

// Server-side fetch with caching only per request
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
        cache: "force-cache", // cache for the lifetime of request
      }
    );

    const data = await response.json();
    return data?.isSuccess ? (data.data as PricingPageItem[]) : [];
  } catch (error) {
    console.error("Failed to fetch Pricing page content:", error);
    return [];
  }
}

// ✅ Force server-rendering (no static HTML)
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const pricingItems = await fetchPricingPageData();

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center">
        {/* Page Title */}
        <h1 className="text-white mb-2 text-3xl font-bold">
          Pricing
        </h1>

        {/* Breadcrumb below title */}
        <Breadcrumb
          segments={["pricing"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container py-5">
        <h2 className="mb-1">Our Pricing Plans</h2>
        <hr className="mb-4 mt-2" />

        {pricingItems.length > 0 ? (
          pricingItems.map((item: PricingPageItem) => (
            <div key={item.pricing_id} className="mb-5">
              <h5 className="text-dark">{item.title}</h5>
              <p className="text-secondary">{item.description}</p>

              {/* Online/Offline status */}
              {/* <p className="text-primary fw-semibold">
                {item.is_online === "Y" ? "Available Online" : "Offline Only"}
              </p> */}

              {/* Closing content */}
              {item.closing_content && (
                <p className="text-muted">
                  {item.closing_content.replace(/\*\*/g, "")}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted">
            No pricing information available at the moment.
          </p>
        )}
      </div>

    <Packages />
        </section>

  );

}
