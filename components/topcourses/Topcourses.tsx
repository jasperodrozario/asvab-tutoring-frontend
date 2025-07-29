'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Course {
  course_id: string;
  course_code: string;
  name: string;
  details: string;
  image: string;
}

// HTML Entity Decoder using DOMParser (equivalent to PHP's html_entity_decode)
const htmlEntityDecodeParser = (str: string): string => {
  if (!str || typeof window === 'undefined') return str || '';
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${str}</body></html>`, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch (error) {
    console.warn('Failed to decode with DOMParser:', error);
    return str;
  }
};

// Strip HTML tags
const stripHtmlTags = (str: string): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
};

// Clean and format text
const cleanText = (str: string): string => {
  if (!str) return '';
  
  return str
    .replace(/\r\n/g, ' ')     // Replace CRLF with space
    .replace(/\n/g, ' ')       // Replace LF with space
    .replace(/\r/g, ' ')       // Replace CR with space
    .replace(/\t/g, ' ')       // Replace tabs with space
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();                   // Remove leading/trailing whitespace
};

// Main utility function to get plain text preview
const getPlainTextPreview = (htmlString: string, maxLength: number = 100): string => {
  if (!htmlString) return 'No description available';
  
  try {
    // Step 1: Decode HTML entities using DOMParser
    let processedText = htmlEntityDecodeParser(htmlString);
    
    // Step 2: Strip HTML tags
    processedText = stripHtmlTags(processedText);
    
    // Step 3: Clean and format text
    processedText = cleanText(processedText);
    
    // Step 4: Limit character count with smart truncation
    if (processedText.length > maxLength) {
      // Find the last complete word within the limit
      const truncated = processedText.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      
      if (lastSpaceIndex > maxLength * 0.8) {
        // If we have a good word boundary, use it
        processedText = truncated.substring(0, lastSpaceIndex) + '...';
      } else {
        // Otherwise, just truncate at character limit
        processedText = truncated + '...';
      }
    }
    
    return processedText;
    
  } catch (error) {
    console.warn('Error processing text:', error);
    return 'Description unavailable';
  }
};

export default function TopCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const formData = new FormData();
        formData.append('action', 'get-course');

        const res = await fetch('/api/proxy', {
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
    return path.startsWith('http') ? path : `https://test-prep.asvab-tutoring.com/${path}`;
  };

  // Show loading state during hydration
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
          {!loading && !error && courses.map((course) => (
            <div className="col-sm-6 col-lg-3" key={course.course_id}>
              <div className="card h-100 shadow-sm hover-lift">
                <Image
                  src={resolveImageUrl(course.image)}
                  alt={course.name || 'Course'}
                  className="card-img-top"
                  width={400}
                  height={200}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-semibold">
                    {course.name || course.course_code}
                  </h5>
                  
                  {/* Updated: Using htmlEntityDecodeParser instead of dangerouslySetInnerHTML */}
                  <p className="card-text small text-muted">
                    {getPlainTextPreview(course.details, 100)}
                  </p>
                  
                  <div className="text-center mt-auto">
                    <Link href="#" className="btn btn-secondary-custom btn-sm w-50">
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