import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap | ASVAB Tutoring",
  description:
    "Browse all ASVAB Tutoring online course and tutor pages organized by city and exam type.",
  openGraph: {
    title: "Sitemap | ASVAB Tutoring",
    description:
      "Browse all ASVAB Tutoring online course and tutor pages organized by city and exam type.",
    type: "website",
  },
};

/** Revalidate cached sitemap HTML periodically (ISR). */
export const revalidate = 3600;

interface SitemapItem {
  course_id: string;
  course_code: string;
  name: string;
  city: string;
}

function getPhpApiUrl(): string | undefined {
  return process.env.PHP_API_URL || process.env.NEXT_PUBLIC_PHP_API_URL;
}

async function fetchSitemapItems(): Promise<SitemapItem[]> {
  const apiUrl = getPhpApiUrl();
  if (!apiUrl) {
    console.error("Sitemap: PHP API URL is not configured");
    return [];
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "get-sitemap" }),
      next: { revalidate },
    });

    if (!response.ok) {
      console.error("Sitemap: API returned", response.status);
      return [];
    }

    const result = await response.json();
    if (result?.isSuccess && Array.isArray(result.data)) {
      return result.data as SitemapItem[];
    }
  } catch (error) {
    console.error("Error fetching sitemap:", error);
  }

  return [];
}

function getSitemapHref(item: SitemapItem): string {
  const citySlug = item.city.toLowerCase().replace(/\s+/g, "-");
  return `/online-courses/${citySlug}/${item.course_code}-tutor`;
}

export default async function SitemapPage() {
  const items = await fetchSitemapItems();

  return (
    <main className="container py-5">
      <h1
        className="text-center text-white py-3 mb-5"
        style={{ backgroundColor: "#f2a155", borderRadius: "6px" }}
      >
        Sitemap
      </h1>

      {items.length === 0 ? (
        <p className="text-center text-muted">
          Sitemap links are temporarily unavailable. Please try again later.
        </p>
      ) : (
        <nav aria-label="Sitemap">
          <ul className="row g-3 list-unstyled mb-0">
            {items.map((item) => (
              <li
                key={`${item.course_id}-${item.city}-${item.course_code}`}
                className="col-12 col-md-6 col-lg-4"
              >
                <Link
                  href={getSitemapHref(item)}
                  className="sitemap-link d-block text-decoration-none p-3 h-100 shadow-sm rounded bg-light text-dark"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
