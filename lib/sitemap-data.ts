export const SITEMAP_REVALIDATE_SECONDS = 3600;

export interface SitemapLink {
  url: string;
  path: string;
  label: string;
}

export interface SitemapSection {
  category: string;
  links: SitemapLink[];
}

/** Core indexable routes used when the API is unavailable. */
export const CORE_SITEMAP_PATHS: string[] = [
  "/",
  "/about-us",
  "/how-it-works",
  "/faq",
  "/sitemap",
  "/our-mobile-apps",
  "/courses/asvab",
  "/courses/afoqt",
  "/courses/sift",
  "/courses/astb",
  "/courses/oar",
  "/services/1-on-1-tutoring",
  "/services/group-tutoring",
  "/services/self-study",
  "/pricing/1-on-1-tutoring",
  "/pricing/group-tutoring",
  "/pricing/self-study",
  "/our-tutors",
  "/privacy-policy",
  "/terms-of-service",
  "/blog",
  "/contact-us",
];

function getPhpApiUrl(): string | undefined {
  return process.env.PHP_API_URL || process.env.NEXT_PUBLIC_PHP_API_URL;
}

export async function fetchSitemapSections(): Promise<SitemapSection[]> {
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
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error("Sitemap: API returned", response.status);
      return [];
    }

    const result = await response.json();
    if (result?.isSuccess && Array.isArray(result.data)) {
      return result.data as SitemapSection[];
    }
  } catch (error) {
    console.error("Error fetching sitemap:", error);
  }

  return [];
}

export async function fetchSitemapPaths(): Promise<string[]> {
  const sections = await fetchSitemapSections();
  const paths = sections.flatMap((section) =>
    section.links.map((link) => link.path).filter(Boolean),
  );

  if (paths.length === 0) {
    return CORE_SITEMAP_PATHS;
  }

  return [...new Set([...CORE_SITEMAP_PATHS, ...paths])];
}
