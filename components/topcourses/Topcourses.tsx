'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Course {
  course_id: string;
  course_code: string;
  name: string;
  details: string;
  image_src: string;
}

// HTML Entity Decoder using DOMParser
const htmlEntityDecodeParser = (str: string): string => {
  if (!str || typeof window === 'undefined') return str || '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${str}</body></html>`, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch {
    return str;
  }
};

// Strip HTML tags
const stripHtmlTags = (str: string): string => str?.replace(/<[^>]*>/g, '') || '';

// Clean and format text
const cleanText = (str: string): string =>
  str
    ?.replace(/\r\n|\n|\r|\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';

// Main utility function to get plain text preview
const getPlainTextPreview = (htmlString: string, maxLength: number = 100): string => {
  if (!htmlString) return 'No description available';
  try {
    let processedText = htmlEntityDecodeParser(htmlString);
    processedText = stripHtmlTags(processedText);
    processedText = cleanText(processedText);

    if (processedText.length > maxLength) {
      const truncated = processedText.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      processedText =
        lastSpaceIndex > maxLength * 0.8
          ? truncated.substring(0, lastSpaceIndex) + '...'
          : truncated + '...';
    }

    return processedText;
  } catch {
    return 'Description unavailable';
  }
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
        formData.append('action', 'get-all-courses'); // ✅ updated API action

        const res = await fetch('https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();

        if (result?.isSuccess && Array.isArray(result.data)) {
          setCourses(result.data);
        } else {
          console.error('Unexpected response:', result);
          setError('Failed to load course list.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('An error occurred while fetching courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const resolveImageUrl = (path: string): string => {
    if (!path) return '/images/asvab-courses-d.jpg';

    const cleanPath = path.trim(); // ✅ remove trailing spaces

    return cleanPath.startsWith('http')
      ? cleanPath
      : `https://test-prep.asvab-tutoring.com/${encodeURIComponent(cleanPath)}`;
  };

  if (!mounted) {
    return (
      <section className="bg-dark-blue text-white py-5 px-3">
        <div className="text-center mb-5 position-relative">
          <h2 className="fw-bold display-5 d-inline-block pb-3 position-relative">
            Top Courses
            <Image
              src="/images/border_v1.png"
              alt="underline"
              width={160}
              height={8}
              className="position-absolute start-50 translate-middle-x bottom-0"
              style={{ objectFit: 'cover' }}
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
    <section className="bg-dark-blue text-white py-5 px-3">
      <div className="text-center mb-5 position-relative">
        <h2 className="fw-bold display-5 d-inline-block pb-3 position-relative">
          Top Courses
          <Image
            src="/images/border_v1.png"
            alt="underline"
            width={160}
            height={8}
            className="position-absolute start-50 translate-middle-x bottom-0"
            style={{ objectFit: 'cover' }}
          />
        </h2>
      </div>

      <div className="container">
        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-danger">{error}</p>}

        <div className="row g-4">
          {!loading &&
            !error &&
            courses.map((course) => (
              <div className="col-sm-6 col-lg-3" key={course.course_id}>
                <div className="card h-100 shadow-sm hover-lift">
                  <Image
                    src={resolveImageUrl(course.image_src)}
                    alt={course.name || 'Course'}
                    className="card-img-top"
                    width={400}
                    height={200}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-semibold">{course.name || course.course_code}</h5>
                    <p className="card-text small text-muted">
                      {getPlainTextPreview(course.details, 100)}
                    </p>
                    <div className="text-center mt-auto">
                      <Link href={`/course-detail/${encodeURIComponent(course.course_code)}`} className="btn btn-secondary-custom btn-sm w-50">
                        LEARN MORE
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
