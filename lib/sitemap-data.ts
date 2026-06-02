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

/** Legacy flat rows from PHP `get-sitemap` (course × city). */
interface LegacySitemapEntry {
  course_code: string;
  city: string;
  name?: string;
}

function isSitemapSection(item: unknown): item is SitemapSection {
  if (!item || typeof item !== "object") return false;
  const section = item as SitemapSection;
  return (
    typeof section.category === "string" && Array.isArray(section.links)
  );
}

function isLegacySitemapEntry(item: unknown): item is LegacySitemapEntry {
  if (!item || typeof item !== "object") return false;
  const entry = item as LegacySitemapEntry;
  return (
    typeof entry.course_code === "string" &&
    entry.course_code.length > 0 &&
    typeof entry.city === "string" &&
    entry.city.length > 0
  );
}

function cityToSlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

function legacyEntryToLink(entry: LegacySitemapEntry): SitemapLink {
  const path = `/online-courses/${cityToSlug(entry.city)}/${entry.course_code.toLowerCase()}-tutor`;
  return {
    url: path,
    path,
    label: entry.name ?? `${entry.course_code} Tutor in ${entry.city}`,
  };
}

/** Normalize API payload: sectioned sitemap or legacy course×city list. */
function normalizeSitemapData(data: unknown[]): SitemapSection[] {
  if (data.length === 0) return [];

  if (data.every(isSitemapSection)) {
    return data.map((section) => ({
      category: section.category,
      links: section.links.filter((link) => Boolean(link?.path)),
    }));
  }

  if (data.every(isLegacySitemapEntry)) {
    return [
      {
        category: "Online Courses",
        links: data.map(legacyEntryToLink),
      },
    ];
  }

  console.error(
    "Sitemap: API data shape is unrecognized; expected sections with links or legacy course/city rows",
  );
  return [];
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
      return normalizeSitemapData(result.data);
    }
  } catch (error) {
    console.error("Error fetching sitemap:", error);
  }

  return [];
}

export async function fetchSitemapPaths(): Promise<string[]> {
  const sections = await fetchSitemapSections();
  const paths = sections.flatMap((section) =>
    (section.links ?? []).map((link) => link.path).filter(Boolean),
  );

  if (paths.length === 0) {
    return CORE_SITEMAP_PATHS;
  }

  return [...new Set([...CORE_SITEMAP_PATHS, ...paths])];
}
