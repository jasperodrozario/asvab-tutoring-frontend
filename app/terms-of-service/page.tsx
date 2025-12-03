import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export const metadata = {
  title: "Terms of Service | ASVAB Tutoring",
  description:
    "Read our Terms of Service outlining the rules, responsibilities, and legal agreements for using ASVAB Tutoring services.",
};

type TermsItem = {
  id: string;
  title: string;
  description: string;
};

async function fetchTerms(): Promise<TermsItem | null> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "get-terms-conditions",
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (data?.isSuccess && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as TermsItem;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch terms and conditions:", error);
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function TermsOfServicePage() {
  const terms = await fetchTerms();

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
        {terms ? (
          <div
            dangerouslySetInnerHTML={{
              __html: terms.description,
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
