"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

type PrivacyPolicyItem = {
  id: string;
  title: string;
  description: string;
};

// HTML Decode function
function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<PrivacyPolicyItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrivacyPolicy() {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "get-privacy-policy",
          }),
        });

        const text = await response.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("API returned HTML instead of JSON:", e);
          setPolicy(null);
          setLoading(false);
          return;
        }

        if (data?.isSuccess && Array.isArray(data.data)) {
          setPolicy(data.data[0]);
        } else {
          setPolicy(null);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrivacyPolicy();
  }, []);

  const pageTitle = policy?.title || "Privacy Policy";

  return (
    <section className="bg-light">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">{pageTitle}</h1>
        <Breadcrumb
          segments={["privacy-policy"]}
          dynamicTitle={pageTitle}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container py-4">
        {loading ? (
          <p>Loading...</p>
        ) : policy ? (
          <div
            dangerouslySetInnerHTML={{
              __html: decodeHtml(policy.description),
            }}
          />
        ) : (
          <p className="text-muted">Privacy policy content not found.</p>
        )}
      </div>
    </section>
  );
}
