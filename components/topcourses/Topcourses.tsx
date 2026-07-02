"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PredictionTestLinkButton from "@/components/prediction-test/PredictionTestLinkButton";
import { ALL_FREE_PREDICTION_TESTS_HREF } from "@/lib/prediction-test-links";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./topcourses.css";

interface Course {
  course_id: string;
  course_code: string;
  name: string;
  full_form: string;
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

/** Shared Card Component for List and Carousel */
const CourseCard = ({ course }: { course: Course }) => {
  const courseHref = `/courses/${encodeURIComponent(course.course_code)}`;

  return (
    <div className="card h-100 shadow-sm hover-lift mb-2 d-flex flex-column course-card">
      <Link
        href={courseHref}
        className="text-decoration-none text-dark d-flex flex-column flex-grow-1"
      >
        <img
          src={resolveImageUrl(course.image_src)}
          alt={course.name || "Course"}
          className="card-img-top course-card-img"
          width={300}
          height={210}
        />
        <div className="card-body d-flex flex-column flex-grow-1 pb-2">
          <h5 className="card-title fw-semibold text-dark text-center">
            <span className="course-name">{course.name}</span>
            <br />
            <span className="course-full-form">{course.full_form}</span>
          </h5>
          <p className="card-text small text-dark flex-grow-1 mb-0">
            {getPlainTextPreview(course.details, 100)}
          </p>
        </div>
      </Link>
      <div className="text-center px-3 pb-3 course-card-footer">
        <Link
          href={courseHref}
          className="btn btn-secondary-custom btn-sm"
          style={{ minWidth: "7rem" }}
        >
          LEARN MORE
        </Link>
      </div>
    </div>
  );
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

        {/* Desktop Carousel (>= 992px) */}
        <div className="pb-3 position-relative slider-wrapper d-none d-lg-block">
          {!loading && !error && (
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={3}
              loop={true}
              navigation={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              breakpoints={{
                992: { slidesPerView: 3 },
                768: { slidesPerView: 3 },
              }}
              className="top-courses-swiper py-3"
            >
              {courses.map((course) => (
                <SwiperSlide key={course.course_id} className="course-slide">
                  <CourseCard course={course} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Mobile & Tablet List (< 992px) */}
        <div className="d-block d-lg-none">
          {!loading && !error && (
            <div className="row g-4 pb-3">
              {courses.map((course) => (
                <div className="col-12" key={course.course_id}>
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="text-center mt-3 d-flex flex-wrap justify-content-center gap-3">
            <Link
              href="/free-practice-tests"
              className="btn btn-primary-custom px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-clipboard-check" aria-hidden />
              Take a Free Practice Test
            </Link>
            <PredictionTestLinkButton href={ALL_FREE_PREDICTION_TESTS_HREF}>
              Take a Free Prediction Test
            </PredictionTestLinkButton>
          </div>
        )}
      </div>
    </section>
  );
}
