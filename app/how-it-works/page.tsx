// app/how-it-works/page.tsx
import React from "react";

type HowItWorkItem = {
  id: number | string;
  title: string;
  description: string; // may contain escaped HTML like "&lt;p&gt;...&lt;/p&gt;"
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
  // First decode HTML entities like &lt; &gt; &amp; and numeric entities
  const decoded = decodeHtmlEntitiesServer(htmlString);

  // Trim and return
  return decoded.trim();
}

// Server-side fetch
async function fetchHowItWorkPageData(): Promise<HowItWorkItem[]> {
  try {
    const response = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ action: "get-how-it-works" }),
        // adjust caching as needed
        cache: "force-cache",
      }
    );

    const data = await response.json();
    return data?.isSuccess ? (data.data as HowItWorkItem[]) : [];
  } catch (error) {
    console.error("Failed to fetch How it works page content:", error);
    return [];
  }
}

// Force server-rendering (no static HTML)
export const dynamic = "force-dynamic";

export default async function HowItWorkPage() {
  const aboutItems = await fetchHowItWorkPageData();

  return (
    <section>
      {/* Banner */}
      <div className="banner"> <h1 className="text-white text-center bg-black bg-opacity-50 py-3 px-4 rounded"> How it works </h1> </div>


      {/* Content */}
      <div className="container pb-5 py-5">
        {aboutItems.length > 0 ? (
          aboutItems.map((item: HowItWorkItem) => {
            // decode & prepare HTML for rendering on server
            const html = processHtmlForRendering(item.description || "");

            return (
              <div key={item.id} className="mb-5">
                <h2 className="text-dark mb-3">{item.title}</h2>
                <hr className="mb-4 mt-2" />

                {/* Render decoded HTML. Ensure this API is trusted. */}
                <div
                  className="text-secondary"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            );
          })
        ) : (
          <p className="text-muted text-center">
            No content available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
