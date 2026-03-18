"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../packageDetails.module.css";
import Link from "next/link";

function decodeHtmlEntitiesOnce(input: string): string {
  if (!input) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = input;
  return txt.value;
}

function decodeHtmlEntitiesDeep(input: string, maxPasses = 4): string {
  if (!input) return "";
  let prev = input;
  for (let i = 0; i < maxPasses; i++) {
    const next = decodeHtmlEntitiesOnce(prev);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function cleanQuestionText(input: string): string {
  if (!input) return "";
  let decoded = decodeHtmlEntitiesDeep(input);

  decoded = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<\/th>/gi, "\t")
    .replace(/<[^>]*>/g, "")
    .replace(/\\\(|\\\)/g, "")
    .replace(/\^(\d+)\/_({?)(\d+)(}?)/g, "$1/$3");

  decoded = decodeHtmlEntitiesDeep(decoded);
  return decoded.trim();
}

function renderTextWithLineBreaks(text: string) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, idx) => (
      <p key={idx} style={{ marginBottom: "0.6em", whiteSpace: "pre-wrap" }}>
        {line}
      </p>
    ));
}

function isSubscriptionSession(session: any): boolean {
  return String(session?.mode ?? "").toLowerCase() === "subscription";
}

export default function SpecificPackageDetailsPage({
  params,
}: {
  params: Promise<{ submenu: string; course_id: string }>;
}) {
  const { submenu, course_id } = use(params);
  const router = useRouter();
  const pathname = usePathname(); // ✅ added
  const isSubscribePage = pathname?.includes("subscribe"); // ✅ added

  const [courseData, setCourseData] = useState<any>(null);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const res = await fetch(process.env.PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "specific-tutoring-package-details-page",
            course_id: String(course_id),
            submenu: String(submenu),
          }),
        });

        const data = await res.json();
        setCourseData(data);
      } catch (err) {
        console.error("API error:", err);
      }
    }

    fetchCourseData();
  }, [submenu, course_id]);

  // ✅ safe boolean compute (works even when courseData is null)
  const showPaymentImage = (() => {
    const allSessions =
      courseData?.data?.flatMap((pkg: any) => pkg?.sessions ?? []) ?? [];
    return allSessions.some((s: any) => !isSubscriptionSession(s));
  })();

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
              <img
                src={courseData.image_src}
                alt={decodeHtmlEntitiesDeep(courseData.course_name ?? "")}
                width={600}
                height={400}
                className="img-fluid rounded shadow-sm"
                style={{ objectFit: "cover" }}
              />
            </div>

            <div className="col-lg-6 text-start">
              <h2 className="fw-bold text-uppercase">
                {decodeHtmlEntitiesDeep(courseData.course_name ?? "")}
              </h2>
              <h4 className="fw-bold text-success mb-3">
                {decodeHtmlEntitiesDeep(courseData.price_range ?? "")}
              </h4>

              {renderTextWithLineBreaks(
                cleanQuestionText(courseData.course_intro ?? ""),
              )}

              {/* ✅ show ONLY for one-time payments */}
              {showPaymentImage && (
                <div className="mt-4">
                  <img
                    src="/images/how_to_send_payment_20260204.png"
                    alt="Payment info"
                    width={600}
                    height={400}
                    className="img-fluid rounded shadow-sm"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      {courseData.data?.map((pkg: any) => (
        <section key={pkg.package_id} className="py-5">
          <div className="container text-center">
            <h1 className={styles.heroTitle}>
              {decodeHtmlEntitiesDeep(pkg.title ?? "")}
            </h1>

            <div
              className="mx-auto text-start"
              style={{ marginTop: "1rem", marginBottom: "2rem" }}
            >
              {renderTextWithLineBreaks(
                cleanQuestionText(pkg.description ?? ""),
              )}
            </div>

            <div className={styles.pricingGrid}>
              {pkg.sessions.map((session: any) => {
                const isSub = isSubscriptionSession(session);
                const buttonLabel = isSub ? "Subscribe" : "Enroll Now";

                return (
                  <div
                    key={session.session_id}
                    className={`${styles.pricingCard} ${
                      session.is_most_popular === "1"
                        ? styles.mostPopularWrap
                        : ""
                    }`}
                  >
                    {session.is_most_popular === "1" && (
                      <div className={styles.mostPopularBadge}>
                        Most Popular
                      </div>
                    )}

                    <div className={styles.cardInner}>
                      <div className={styles.cardTitleWrap}>
                        <h4 className={styles.cardTitle}>
                          {decodeHtmlEntitiesDeep(session.title ?? "")}
                        </h4>
                      </div>

                      <div className={styles.priceWrap}>
                        <div className={styles.price}>
                          ${decodeHtmlEntitiesDeep(String(session.price ?? ""))}
                        </div>
                      </div>

                      <div className={styles.featureWrap}>
                        <div className={styles.featureBox}>
                          {renderTextWithLineBreaks(
                            cleanQuestionText(session.feature ?? ""),
                          )}
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <Link
                          href={{
                            pathname: "/checkout",
                            query: {
                              course_id: String(course_id),
                              package_id: String(pkg.package_id),
                              session_id: String(session.session_id),
                              amount: String(
                                Math.round(Number(session.price) * 100),
                              ),
                              mode: isSub ? "subscription" : "one_time",
                              product: String(session.product ?? ""),
                              cadence: String(session.cadence ?? ""),
                            },
                          }}
                          className="text-decoration-none"
                        >
                          <button
                            className={`btn btn-primary-custom ${styles.cardBtn}`}
                          >
                            {buttonLabel}
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* ✅ Notes + Cancellation Policy (fixed) */}
      <div className="container">
        {isSubscribePage ? (
          <p
            className="fs-6 text-start mx-auto mb-5"
            style={{ maxWidth: "960px" }}
          >
            <span className="fw-semibold text-danger">NOTE:</span> Each
            subscription is auto-renewable until you cancel it.
          </p>
        ) : (
          <>
            <p
              className="fs-6 text-start mx-auto mb-3"
              style={{ maxWidth: "960px" }}
            >
              <span className="fw-semibold text-danger">NOTE:</span> No session
              will be scheduled without payment information on file. Students
              are required to submit homework before each session.
            </p>

            <p
              className="fs-6 text-start mx-auto mb-5"
              style={{ maxWidth: "960px" }}
            >
              <span className="fw-semibold text-primary">
                Cancellation Policy:
              </span>{" "}
              If you want to cancel a session or reschedule, 24 hrs. advance
              notice is required. You can cancel the entire service within 7
              days.
            </p>
          </>
        )}
      </div>

      {/* Related Courses */}
      <section className="py-5 bg-white">
        <div className="container">
          <h5 className="mb-4 text-uppercase fs-3 fw-bold text-center">
            Related Packages
          </h5>

          <div className="row g-4">
            {courseData.related_courses?.length > 0 ? (
              courseData.related_courses.map((rel: any) => (
                <div
                  key={rel.course_id}
                  className="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <div
                    className="card h-100 shadow-sm border-0 cursor-pointer"
                    style={{ borderRadius: "10px" }}
                    onClick={() =>
                      router.push(
                        `/SpecificPackageDetailsPage/${submenu}/${rel.course_id}`,
                      )
                    }
                  >
                    <div className="card-body p-3 d-flex flex-column">
                      <img
                        src={rel.image}
                        alt={decodeHtmlEntitiesDeep(rel.name ?? "")}
                        width={300}
                        height={200}
                        className="rounded mb-3 w-100"
                        style={{ objectFit: "cover", height: "200px" }}
                      />
                      <h6
                        className="fw-semibold mb-2"
                        style={{ color: "#e58a34" }}
                      >
                        {decodeHtmlEntitiesDeep(rel.name ?? "")}
                      </h6>
                      <p className="fw-bold text-success mb-0 mt-auto">
                        {decodeHtmlEntitiesDeep(rel.price_range ?? "")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">No related packages available.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
