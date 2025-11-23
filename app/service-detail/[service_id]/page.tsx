// import { Metadata } from "next";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

// ======================
// Types
// ======================
type ServiceDetail = {
  service_id: string;
  title: string;
  is_online: string;
  course_name: string;
  course_id: string;
  ord: string;
  description: string;
};

// Decode HTML entities
function decodeHtmlEntitiesServer(input: string): string {
  if (!input) return "";
  const entityMap: Record<string, string> = {
    lt: "<",
    gt: ">",
    amp: "&",
    quot: '"',
    apos: "'",
    nbsp: "\u00A0",
  };
  return input.replace(/&([a-zA-Z]+);/g, (_, e) => entityMap[e] || _);
}

function cleanHTML(html: string) {
  return decodeHtmlEntitiesServer(html).trim();
}

// Fetch API
async function fetchServiceDetail(id: string): Promise<ServiceDetail | null> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "get-specific-service-detail",
          service_id: id,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (data?.isSuccess && data.data) return data.data;
    return null;
  } catch (error) {
    console.error("Failed to fetch service detail:", error);
    return null;
  }
}

export const dynamic = "force-dynamic";

// ===========================
// FIXED FUNCTION SIGNATURE
// ===========================
export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service_id: string }>;
}) {
  const { service_id } = await params;

  const serviceDetail = await fetchServiceDetail(service_id);

  if (!serviceDetail) {
    return (
      <div className="container py-5 text-center text-muted">
        <h3>Service details not found.</h3>
      </div>
    );
  }

  const pageTitle = serviceDetail.title || "Service Detail";

  return (
    <section className="py-4">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded text-center mb-4">
        <h1 className="text-white mb-2 text-3xl fw-bold">{pageTitle}</h1>

        <Breadcrumb
          segments={["services", serviceDetail.service_id]}
          dynamicTitle={pageTitle}
          className="text-white text-base mt-1"
        />
      </div>

      <div className="container">
        <div className="mb-4">
          <h4 className="fw-semibold">{serviceDetail.course_name}</h4>
        </div>

        <div
          className="service-description"
          dangerouslySetInnerHTML={{
            __html: cleanHTML(serviceDetail.description),
          }}
        />
      </div>
    </section>
  );
}
