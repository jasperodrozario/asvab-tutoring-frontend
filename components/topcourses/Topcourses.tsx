"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Course {
  course_id: string;
  course_code: string;
  name: string;
  details: string;
  image_src: string;
}

/**
 * Decode HTML entities (named + numeric) into their character equivalents.
 * Works on server & client without DOM.
 */
const decodeHtmlEntities = (input: string): string => {
  if (!input) return "";

  // Replace some common named entities first
  const namedMap: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
  };

  // Replace named entities like &nbsp; &amp;
  let s = input.replace(/&([a-zA-Z]+);/g, (match, name) => {
    if (Object.prototype.hasOwnProperty.call(namedMap, name))
      return namedMap[name];
    return match; // leave unknown named entities for numeric handler
  });

  // Replace decimal numeric entities: &#123;
  s = s.replace(/&#(\d+);/g, (_match, dec) => {
    try {
      return String.fromCharCode(Number(dec));
    } catch {
      return "";
    }
  });

  // Replace hex numeric entities: &#x1f600;
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return "";
    }
  });

  return s;
};

/** Remove HTML tags (anything between < and >) */
const stripHtmlTags = (str: string): string =>
  str ? str.replace(/<[^>]*>/g, "") : "";

/** Collapse whitespace and trim */
const cleanWhitespace = (str: string): string =>
  (str || "")
    .replace(/\r\n|\n|\r|\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Convert an HTML/HTML-encoded string into plain preview text.
 * This function:
 *  - runs decode+strip loops to handle both encoded tags (&lt;h2&gt;) and raw tags (<h2>)
 *  - decodes remaining entities (e.g. &nbsp;)
 *  - collapses whitespace and truncates cleanly
 */
const getPlainTextPreview = (htmlString: string, maxLength = 100): string => {
  if (!htmlString) return "No description available";

  try {
    let s = htmlString;

    // Run a few passes to handle double-encoded strings safely:
    // decode -> strip tags -> decode -> strip tags ...
    for (let i = 0; i < 3; i += 1) {
      s = decodeHtmlEntities(s);
      s = stripHtmlTags(s);
    }

    // Final decode for any leftover entities like &nbsp;
    s = decodeHtmlEntities(s);

    // Clean whitespace
    s = cleanWhitespace(s);

    if (!s) return "No description available";

    if (s.length > maxLength) {
      const truncated = s.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > Math.floor(maxLength * 0.6)) {
        s = truncated.substring(0, lastSpace) + "...";
      } else {
        s = truncated + "...";
      }
    }

    return s;
  } catch {
    return "Description unavailable";
  }
};

/** Build a safe image URL — trims and encodes as needed */
const resolveImageUrl = (path?: string): string => {
  if (!path) return "/images/asvab-courses-d.jpg";

  const cleaned = path.trim();

  // If already absolute URL → return as is
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  // Use env-based base URL
  return `${process.env.NEXT_PUBLIC_RESOURCES_URL}/${encodeURI(cleaned)}`;
};

export default function TopCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "get-all-courses");

        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (result?.isSuccess && Array.isArray(result.data)) {
          setCourses(result.data);
        } else {
          console.error("Unexpected response:", result);
          setError("Failed to load course list.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An error occurred while fetching courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (!mounted) {
    return (
      <section className="bg-dark-blue text-white py-5 px-3">
        <div className="text-center mb-5 position-relative">
          <h2 className="fw-bold display-5 d-inline-block pb-3 position-relative">
            Our Courses
            <img
              src="/images/border_v1.png"
              alt="underline"
              width={160}
              height={8}
              className="position-absolute start-50 translate-middle-x bottom-0"
              style={{ objectFit: "cover" }}
            />
          </h2>
        </div>
        <div className="container">
          <p className="text-center">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="top-courses" className="bg-dark-blue text-white py-5 px-3">
      <div className="text-center mb-5 position-relative">
        <h2 className="fw-bold display-5 d-inline-block pb-3 position-relative">
          Our Courses
          <img
            src="/images/border_v1.png"
            alt="underline"
            width={160}
            height={8}
            className="position-absolute start-50 translate-middle-x bottom-0"
            style={{ objectFit: "cover" }}
          />
        </h2>
      </div>

      <div className="container">
        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-danger">{error}</p>}

        <div className="row justify-content-center g-4 pb-3">
          {!loading &&
            !error &&
            courses.map((course) => (
              <div className="col-sm-6 col-lg-4" key={course.course_id}>
                <Link
                  href={`/course-detail/${encodeURIComponent(course.course_code)}`}
                >
                  <div className="card h-100 shadow-sm hover-lift">
                    <img
                      src={resolveImageUrl(course.image_src)}
                      alt={course.name || "Course"}
                      className="card-img-top"
                      width={300}
                      height={210}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title fw-semibold">
                        {course.name || course.course_code}
                      </h5>
                      <p className="card-text small">
                        {getPlainTextPreview(course.details, 100)}
                      </p>
                      <div className="text-center mt-auto">
                        <button className="btn btn-secondary-custom btn-sm w-50">
                          LEARN MORE
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
