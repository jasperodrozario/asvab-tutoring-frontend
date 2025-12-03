import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export const metadata = {
  title: "Privacy Policy | ASVAB Tutoring",
  description:
    "Read our privacy policy to understand how we collect, use, and protect your personal data.",
};

type PrivacyPolicyItem = {
  id: string;
  title: string;
  description: string;
};

async function fetchPrivacyPolicy(): Promise<PrivacyPolicyItem | null> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "get-privacy-policy",
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (data?.isSuccess && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as PrivacyPolicyItem;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch privacy policy:", error);
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  const policy = await fetchPrivacyPolicy();

  const pageTitle = policy?.title || "Privacy Policy";

  return (
    <section className="bg-light">
      {/* ✅ Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">{pageTitle}</h1>
        <Breadcrumb
          segments={["privacy-policy"]}
          dynamicTitle={pageTitle}
          className="text-white text-base mt-1"
        />
      </div>

      {/* ✅ Content */}
      <div className="container py-4">
        {policy ? (
          <div
            dangerouslySetInnerHTML={{
              __html: policy.description,
            }}
          />
        ) : (
          <p className="text-muted">
            Privacy policy content is not available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
