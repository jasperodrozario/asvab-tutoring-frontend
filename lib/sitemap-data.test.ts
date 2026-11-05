import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ASVAB_RESOURCES } from "@/lib/asvab-resources";
import { fetchSitemapPageSections, fetchSitemapPaths } from "@/lib/sitemap-data";

vi.mock("@/lib/php-api", () => ({
  fetchFreePracticeTestCatalog: vi.fn(async () => []),
  fetchFreePredTestCatalog: vi.fn(async () => []),
}));

const apiFetch = vi.fn();

beforeEach(() => {
  vi.stubEnv("PHP_API_URL", "https://example.com/sitemap-api");
  vi.stubGlobal("fetch", apiFetch);
  apiFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("ASVAB resource discovery", () => {
  it("keeps every resource in the XML paths when the backend inventory is empty", async () => {
    apiFetch.mockResolvedValue(Response.json({ isSuccess: true, data: [] }));

    const paths = await fetchSitemapPaths();

    for (const resource of ASVAB_RESOURCES) {
      expect(paths).toContain(resource.path);
    }
    expect(paths).toContain("/courses/asvab");
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("shows resource links in the HTML sitemap even without backend configuration", async () => {
    vi.stubEnv("PHP_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_PHP_API_URL", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const sections = await fetchSitemapPageSections();
      expect(sections.flatMap((section) => section.links.map((link) => link.path)))
        .toEqual(ASVAB_RESOURCES.map((resource) => resource.path));
      expect(apiFetch).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("preserves backend sections and merges already-listed resources without duplicates", async () => {
    const firstResource = ASVAB_RESOURCES[0];
    apiFetch.mockResolvedValue(Response.json({
      isSuccess: true,
      data: [
        { category: "Courses", links: [{ path: "/courses/asvab", url: "/courses/asvab", label: "ASVAB" }] },
        { category: "ASVAB Preparation Resources", links: [{ path: firstResource.path, url: firstResource.path, label: firstResource.label }] },
      ],
    }));

    const sections = await fetchSitemapPageSections();
    const resources = sections.find((section) => section.category === "ASVAB Preparation Resources");

    expect(resources?.links.map((link) => link.path)).toEqual(ASVAB_RESOURCES.map((resource) => resource.path));
    expect(sections.find((section) => section.category === "Courses")?.links[0].path).toBe("/courses/asvab");
  });
});
