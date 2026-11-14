import { describe, expect, it } from "vitest";
import {
  findFreePracticeTestSubjectIndex,
  getFreePracticeTestSubjectHref,
  getFreePracticeTestSubjectSlug,
} from "./free-practice-test-routes";

describe("free practice test subject routes", () => {
  it("converts a subject name to a URL-safe slug", () => {
    expect(getFreePracticeTestSubjectSlug("Arithmetic Reasoning")).toBe(
      "arithmetic-reasoning",
    );
    expect(getFreePracticeTestSubjectSlug("Automotive & Shop Information")).toBe(
      "automotive-shop-information",
    );
  });

  it("builds a course subject URL", () => {
    expect(getFreePracticeTestSubjectHref("asvab", "Word Knowledge")).toBe(
      "/courses/asvab/free-practice-test/word-knowledge",
    );
  });

  it("resolves a slug back to its subject index", () => {
    expect(
      findFreePracticeTestSubjectIndex(
        ["Arithmetic Reasoning", "Word Knowledge"],
        "word-knowledge",
      ),
    ).toBe(1);
    expect(findFreePracticeTestSubjectIndex(["Word Knowledge"], "math")).toBe(
      -1,
    );
  });
});
