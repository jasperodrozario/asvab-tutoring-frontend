"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../packageDetails.module.css";
import Link from "next/link";
import Button from "@/components/button/Button";

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

const serviceTypeToSubmenuMap: Record<string, string> = {
  "one-on-1-tutoring": "one",
  "one-on-one-tutoring": "one",
  "group-tutoring": "group",
  "self-study": "subscribe",
};

const courseCodeToIdMap: Record<string, string> = {
  asvab: "40",
  afoqt: "49",
  sift: "50",
  astb: "51",
  oar: "52",
};

function convertServiceTypeToSubmenu(serviceType: string): string {
  return serviceTypeToSubmenuMap[serviceType] ?? serviceType;
}

function convertCourseCodeToId(courseCode: string): string {
  return courseCodeToIdMap[courseCode] ?? courseCode;
}

export default function PackageDetailsContent({
  params,
}: {
  params: Promise<{ service_type: string; course_code: string }>;
}) {
  const { service_type, course_code } = use(params);
  const router = useRouter();
  const pathname = usePathname(); // ✅ added
  const isSubscribePage = pathname?.includes("self-study"); // ✅ added

  const [courseData, setCourseData] = useState<any>(null);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const apiSubmenu = convertServiceTypeToSubmenu(service_type);
        const apiCourseId = convertCourseCodeToId(course_code);

        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "specific-tutoring-package-details-page",
            course_id: apiCourseId,
            submenu: apiSubmenu,
          }),
        });

        const data = await res.json();
        setCourseData(data);
      } catch (err) {
        console.error("API error:", err);
      }
    }

    fetchCourseData();
  }, [service_type, course_code]);

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
    <main style={{ paddingTop: 35 }}>
      {/* Pricing Packages */}
      {courseData.data?.map((pkg: any) => (
        <section key={pkg.package_id}>
          <div className="container text-center">
            <h1 className={styles.heroTitle}>
              {decodeHtmlEntitiesDeep(pkg.title ?? "")}
            </h1>

            <div
              className={styles.ckContent}
              dangerouslySetInnerHTML={{
                __html: decodeHtmlEntitiesDeep(pkg.description ?? ""),
              }}
            ></div>

            <div className={styles.pricingGrid}>
              {pkg.sessions.map((session: any) => {
                const isSub = isSubscriptionSession(session);
                const buttonLabel = isSub ? "Subscribe" : "Enroll Now";
                const query = {
                  course_id: convertCourseCodeToId(course_code),
                  package_id: String(pkg.package_id),
                  session_id: String(session.session_id),
                  amount: String(Math.round(Number(session.price) * 100)),
                  mode: isSub ? "subscription" : "one_time",
                  product: String(session.product ?? ""),
                  cadence: String(session.cadence ?? ""),
                };
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
                        <Button
                          pathname={"/checkout"}
                          queryObj={query}
                          className={`btn btn-primary-custom ${styles.cardBtn}`}
                        >
                          {buttonLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Notes + Cancellation Policy */}
      <div className="container pb-4">
        {isSubscribePage ? (
          <p className="fs-6 text-start mx-auto" style={{ maxWidth: "960px" }}>
            <span className="fw-semibold text-danger">NOTE:</span> Your
            subscription will automatically renew at the end of each billing
            cycle (as disclosed at the time of purchase). You may cancel your
            subscription at any time. Upon cancellation, you will retain access
            to the service until the end of your current billing period.
          </p>
        ) : (
          <>
            <p
              className="fs-6 text-start mx-auto"
              style={{ maxWidth: "960px" }}
            >
              <span className="fw-semibold text-danger">NOTE:</span> No session
              will be scheduled without payment information on file. Students
              are required to submit homework before each session.
            </p>

            <p
              className="fs-6 text-start mx-auto"
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
      <section className="bg-white">
        <div className="container">
          <h5 className="fs-3 fw-bold text-center" style={{ color: "#e58a34" }}>
            Other Packages
          </h5>

          <div className={styles.relatedGrid}>
            {courseData.related_courses?.length > 0 ? (
              courseData.related_courses.map((rel: any) => (
                <div key={rel.course_id} className={styles.relatedCardWrapper}>
                  <div
                    className="card h-100 shadow-sm border-0 cursor-pointer related-course-card text-center"
                    style={{ borderRadius: "10px" }}
                    onClick={() =>
                      router.push(
                        `/package-details/${service_type}/${rel.course_code}`,
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
                        className="fw-semibold mb-2 related-course-card-title text-center"
                        style={{ color: "#e58a34", width: "100%" }}
                      >
                        <span className="course-name">
                          {decodeHtmlEntitiesDeep(rel.name ?? "")}
                        </span>
                        {rel.full_form && (
                          <>
                            <br />
                            <span className="course-full-form">
                              {decodeHtmlEntitiesDeep(rel.full_form)}
                            </span>
                          </>
                        )}
                      </h6>
                      <p className="fw-bold text-success mb-0 mt-auto">
                        {decodeHtmlEntitiesDeep(rel.price_range ?? "")
                          .split(" (")
                          .map((part: string, i: number) => (
                            <React.Fragment key={i}>
                              {i > 0 && <br />}
                              {i > 0 ? `(${part}` : part}
                            </React.Fragment>
                          ))}
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
