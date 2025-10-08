'use client';

import React, { use, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../packageDetails.module.css';

function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = input;
  return txt.value;
}

function cleanQuestionText(input: string): string {
  if (!input) return '';

  let decoded = decodeHtmlEntities(input);

  decoded = decoded.replace(/<br\s*\/?>/gi, '\n');
  decoded = decoded.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n');
  decoded = decoded.replace(/<h[1-6][^>]*>/gi, '').replace(/<\/h[1-6]>/gi, '\n\n');
  decoded = decoded.replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n');
  decoded = decoded.replace(/<\/tr>/gi, '\n').replace(/<\/td>/gi, '\t').replace(/<\/th>/gi, '\t');
  decoded = decoded.replace(/<[^>]*>/g, '');
  decoded = decoded.replace(/\\\(|\\\)/g, '');
  decoded = decoded.replace(/\^(\d+)\/_({?)(\d+)(}?)/g, '$1/$3');

  return decoded.trim();
}

function renderTextWithLineBreaks(text: string) {
  return text.split(/\r?\n/).map((line, idx) => (
    <p key={idx} style={{ marginBottom: '0.8em', whiteSpace: 'pre-wrap' }}>
      {line}
    </p>
  ));
}

// ✅ params is required in a dynamic route
export default function PackageDetailsPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const [courseData, setCourseData] = useState<any>(null);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const res = await fetch(
          'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'tutoring-package-details-page',
              course_id: String(course_id),
            }),
          }
        );

        const data = await res.json();
        setCourseData(data);
      } catch (err) {
        console.error('API error:', err);
      }
    }

    fetchCourseData();
  }, [course_id]);

  if (!courseData) {
    return <p className="text-center py-5">Loading...</p>;
  }

  return (
    <main>
      {/* Top Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6 text-center">
              <Image
                src={courseData.image_src}
                alt={courseData.course_name}
                width={600}
                height={400}
                className="img-fluid rounded shadow-sm"
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div className="col-lg-6 text-start">
              <h2 className="fw-bold text-uppercase">{courseData.course_name}</h2>
              <h4 className="fw-bold text-success mb-3">
                {courseData.price_range}
              </h4>

              {renderTextWithLineBreaks(
                cleanQuestionText(courseData.course_intro)
              )}

              <div className="mt-4">
                <Image
                  src="/images/how-to-send-payment-new.webp"
                  alt="Payment info"
                  width={600}
                  height={400}
                  className="img-fluid rounded shadow-sm"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>


{/* Pricing Packages */}
      {courseData.data?.map((pkg: any) => (
        <section key={pkg.package_id} className="py-5">
          <div className="container text-center">
            <h1 className={styles.heroTitle}>{pkg.title}</h1>

            <div
              className="mx-auto text-start"
              style={{ maxWidth: '700px', marginTop: '1rem', marginBottom: '2rem' }}
            >
              {renderTextWithLineBreaks(cleanQuestionText(pkg.description))}
            </div>

            <div
              className={styles.pricingGrid}
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
              }}
            >
              {pkg.sessions.map((session: any) => (
                <div
                  key={session.session_id}
                  className={`${styles.pricingCard} ${session.is_most_popular === '1' ? styles.mostPopularWrap : ''
                    }`}
                  style={{
                    flex: '0 0 300px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '300px',
                  }}
                >
                  {session.is_most_popular === '1' && (
                    <div className={styles.mostPopularBadge}>Most Popular</div>
                  )}
                  <div className={styles.cardInner}>
                    <h4 className={styles.cardTitle}>{session.title}</h4>
                    <div className={styles.price}>${session.price}</div>
                    <div className="text-start" style={{ marginTop: '0.5rem' }}>
                      {renderTextWithLineBreaks(cleanQuestionText(session.feature))}
                    </div>
                  </div>

                  {/* <div style={{ marginTop: '1rem' }}>
                    <button className={styles.buyBtn}>Buy Now</button>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Description + Related */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-8">
              <h3 className="mb-3">Description</h3>
              {renderTextWithLineBreaks(
                cleanQuestionText(courseData.course_description)
              )}
            </div>

            <div className="col-lg-4">
              <h5 className="mb-3 text-uppercase fw-bold">Related Packages</h5>

              {courseData.related_courses?.length > 0 ? (
                courseData.related_courses.map((rel: any) => (
                  <div
                    key={rel.course_id}
                    className="card mb-4 shadow-sm border-0"
                    style={{ borderRadius: "10px" }}
                  >
                    <div className="card-body p-3">
                      <Image
                        src={rel.image}
                        alt={rel.name}
                        width={300}
                        height={200}
                        className="rounded mb-3 w-100"
                        style={{ objectFit: "cover", height: "200px" }}
                      />
                      <h6 className="fw-semibold mb-2">
                        <a
                          href={`/tutor-package-details/${rel.course_id}`}
                          className="text-decoration-none"
                          style={{ color: "#e58a34" }}
                        >
                          {rel.name}
                        </a>
                      </h6>
                      <p className="fw-bold text-success mb-0">{rel.price_range}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No related packages available.</p>
              )}
            </div>


          </div>
        </div>
      </section>

      
    </main>
  );
}
