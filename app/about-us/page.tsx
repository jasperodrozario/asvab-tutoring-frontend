// app/about-us/page.tsx
import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

type AboutItem = {
  id: number | string;
  title: string;
  description: string; // may contain escaped HTML
};

/**
 * Decode HTML entities on server (supports named & numeric entities).
 * Repeats decode until stable to handle double-encoded content.
 */
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

/**
 * Convert escaped/encoded HTML string into real HTML to be rendered.
 */
function processHtmlForRendering(htmlString: string): string {
  if (!htmlString) return "";
  const decoded = decodeHtmlEntitiesServer(htmlString);
  return decoded.trim();
}

/**
 * Fetch About Us data from API
 * Always fetch fresh data (no caching)
 */
async function fetchAboutUsData(): Promise<AboutItem[]> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ action: "get-about-us" }),
        cache: "no-store", // ✅ force fresh data (no caching)
      }
    );

    const data = await response.json();
    return data?.isSuccess ? (data.data as AboutItem[]) : [];
  } catch (error) {
    console.error("Failed to fetch About Us content:", error);
    return [];
  }
}

// ✅ Force server rendering (no static HTML caching)
export const dynamic = "force-dynamic";

export default async function AboutUsPage() {
  const aboutItems = await fetchAboutUsData();

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center">
        <h1 className="text-white mb-2 text-3xl font-bold">About Us</h1>
        <Breadcrumb
          segments={["about-us"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container pb-5 py-5">
        {aboutItems.length > 0 ? (
          aboutItems.map((item: AboutItem) => {
            const html = processHtmlForRendering(item.description || "");
            return (
              <div key={item.id} className="mb-5">
                <h2 className="text-dark mb-3">{item.title}</h2>
                <hr className="mb-4 mt-2" />
                <div
                  className="text-secondary"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            );
          })
        ) : (
          <p className="text-muted text-center">
            No about us information available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
