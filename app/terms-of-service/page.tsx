"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

type TermsItem = {
  id: string;
  title: string;
  description: string;
};

// Decode HTML entities
function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function TermsOfServicePage() {
  const [terms, setTerms] = useState<TermsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTerms() {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "get-terms-conditions",
          }),
        });

        const text = await response.text();
        console.log("Raw Terms response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("API returned HTML instead of JSON.");
          setTerms(null);
          setLoading(false);
          return;
        }

        if (data?.isSuccess && Array.isArray(data.data)) {
          setTerms(data.data[0]);
        } else {
          setTerms(null);
        }
      } catch (error) {
        console.error("Failed to fetch terms:", error);
        setTerms(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTerms();
  }, []);

  const pageTitle = terms?.title || "Terms of Service";

  return (
    <section className="bg-light">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">{pageTitle}</h1>
        <Breadcrumb
          segments={["terms-of-service"]}
          dynamicTitle={pageTitle}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container py-4">
        {loading ? (
          <p>Loading...</p>
        ) : terms ? (
          <div
            dangerouslySetInnerHTML={{
              __html: decodeHtml(terms.description),
            }}
          />
        ) : (
          <p className="text-muted">
            Terms of Service content is not available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
