"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "../../packageDetails.module.css";
import HotDealBanner from "@/components/promotions/HotDealBanner";
import PricingCard, {
  isSubscriptionSession,
} from "@/components/pricing/PricingCard";
import { decodeHtmlEntitiesDeep } from "@/lib/decode-html";
import { convertCourseCodeToId, getFriendlyCourseName } from "@/lib/package-utils";
import type { PackageDetailsResponse } from "@/lib/php-api";

export default function PackageDetailsContent({
  service_type,
  course_code,
  initialCourseData,
}: {
  service_type: string;
  course_code: string;
  initialCourseData: PackageDetailsResponse | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isSubscribePage = pathname?.includes("self-study");
  const courseData = initialCourseData;

  if (!courseData) {
    return (
      <p className="text-center py-5">
        Package details are not available at the moment.
      </p>
    );
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

            {pkg.limited_time === "1" ? (
              <div className="mt-3" style={{ textAlign: "left" }}>
                {/* ── Summer Hot Deal Banner ── */}
                {(() => {
                  const firstSession = pkg.sessions?.[0];
                  const isSub = firstSession
                    ? isSubscriptionSession(firstSession)
                    : false;

                  const getFriendlyPackageType = (type: string) => {
                    if (type === "group-tutoring") return "Group Tutoring";
                    if (type === "1-on-1-tutoring") return "1-on-1 Tutoring";
                    if (type === "self-study") return "Subscription";
                    return "Tutoring";
                  };

                  const checkoutLink = firstSession
                    ? `/checkout/limited-time-offer?${new URLSearchParams({
                        course_id: convertCourseCodeToId(course_code),
                        package_id: String(pkg.package_id),
                        session_id: String(firstSession.session_id),
                        amount: String(
                          Math.round(Number(firstSession.price) * 100),
                        ),
                        mode: isSub ? "subscription" : "one_time",
                        title: `Summer ${getFriendlyCourseName(course_code)} ${getFriendlyPackageType(service_type)}`,
                        tutoring_type: getFriendlyPackageType(service_type),
                      }).toString()}`
                    : "#";

                  return (
                    <HotDealBanner
                      featured={true}
                      courseName={getFriendlyCourseName(course_code)}
                      packageType={getFriendlyPackageType(service_type)}
                      amount={String(firstSession?.price ?? "0")}
                      link={checkoutLink}
                    />
                  );
                })()}
              </div>
            ) : (
              <>
                <div
                  className={styles.ckContent}
                  dangerouslySetInnerHTML={{
                    __html: decodeHtmlEntitiesDeep(pkg.description ?? ""),
                  }}
                />
                <div className={styles.pricingGrid}>
                  {pkg.sessions.map((session: any) => (
                    <PricingCard
                      key={session.session_id}
                      session={session}
                      packageId={pkg.package_id}
                      courseCode={course_code}
                      styles={styles}
                    />
                  ))}
                </div>
              </>
            )}
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
            {(courseData.related_courses?.length ?? 0) > 0 ? (
              courseData.related_courses!.map((rel: any) => (
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
