"use client";

import { useEffect, useState } from "react";

type PricingPageItem = {
  pricing_id: string;
  title: string;
  description: string;
  closing_content: string;
};

function decodeHtml(html: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

export default function PricingContent({ submenu }: { submenu: string }) {
  const [items, setItems] = useState<PricingPageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              action: "specific-get-pricing-page-content",
              submenu,
            }),
          }
        );

        const data = await res.json();

        if (data?.isSuccess && Array.isArray(data.data)) {
          setItems(data.data);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Pricing fetch failed:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [submenu]);

  if (loading) {
    return <p className="text-center py-5">Loading pricing content…</p>;
  }

  if (!items.length) {
    return (
      <p className="text-center py-5">
        No pricing information available at the moment.
      </p>
    );
  }

  return (
    <div className="container pb-5 py-5">
      {items.map((item) => (
        <div key={item.pricing_id} className="mb-5">
          <h2 className="text-dark mb-3">{item.title}</h2>
          <hr className="mb-4 mt-2" />
          <div
            className="mb-3"
            dangerouslySetInnerHTML={{
              __html: decodeHtml(item.description),
            }}
          />
          {item.closing_content && (
            <div
              dangerouslySetInnerHTML={{
                __html: decodeHtml(item.closing_content),
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
