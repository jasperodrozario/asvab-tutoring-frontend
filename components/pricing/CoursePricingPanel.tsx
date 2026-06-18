"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./coursePricing.module.css";
import { isSubscriptionSession } from "./PricingCard";
import CoursePricingCard from "./CoursePricingCard";
import { convertCourseCodeToId } from "@/lib/package-utils";
import type { ServiceType } from "@/types/Services";
import type {
  PackageData,
  PackageSession,
  PackagesByService,
} from "@/lib/package-types";

const SERVICE_ORDER: ServiceType[] = [
  "1-on-1-tutoring",
  "group-tutoring",
  "self-study",
];

const SERVICE_TAB_LABELS: Record<ServiceType, string> = {
  "1-on-1-tutoring": "1-on-1",
  "group-tutoring": "Group",
  "self-study": "Self-Study",
};

const SERVICE_CTA_LABELS: Record<ServiceType, string> = {
  "1-on-1-tutoring": "View 1-on-1 Package Details",
  "group-tutoring": "View Group Package Details",
  "self-study": "View Self-Study Package Details",
};

const FRIENDLY_PACKAGE_TYPE: Record<ServiceType, string> = {
  "1-on-1-tutoring": "1-on-1 Tutoring",
  "group-tutoring": "Group Tutoring",
  "self-study": "Subscription",
};

function getFriendlyCourseName(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("asvab")) return "ASVAB";
  if (c.includes("afoqt")) return "AFOQT";
  if (c.includes("astb")) return "ASTB";
  if (c.includes("sift")) return "SIFT";
  if (c.includes("oar")) return "OAR";
  return "Military Prep";
}

function hasPackages(data: PackagesByService[ServiceType] | undefined): boolean {
  return Boolean(data?.data && data.data.length > 0);
}

type CoursePricingPanelProps = {
  courseCode: string;
  packagesByService: PackagesByService;
  embedded?: boolean;
};

export default function CoursePricingPanel({
  courseCode,
  packagesByService,
  embedded = false,
}: CoursePricingPanelProps) {
  const availableServices = useMemo(
    () => SERVICE_ORDER.filter((s) => hasPackages(packagesByService[s])),
    [packagesByService],
  );

  const [activeService, setActiveService] = useState<ServiceType | null>(
    availableServices[0] ?? null,
  );

  if (availableServices.length === 0 || !activeService) {
    return null;
  }

  const currentService = availableServices.includes(activeService)
    ? activeService
    : availableServices[0];

  const packages = (packagesByService[currentService]?.data ??
    []) as PackageData[];
  const isSelfStudy = currentService === "self-study";

  return (
    <div
      className={`${styles.panel} ${embedded ? styles.panelEmbedded : ""}`}
    >
      <h3 className={styles.panelTitle}>Choose Your Tutoring Plan</h3>

      <div className={styles.tabBar} role="tablist">
        {availableServices.map((service) => (
          <button
            key={service}
            type="button"
            role="tab"
            aria-selected={service === currentService}
            className={`${styles.tabBtn} ${
              service === currentService ? styles.tabBtnActive : ""
            }`}
            onClick={() => setActiveService(service)}
          >
            {SERVICE_TAB_LABELS[service]}
          </button>
        ))}
      </div>

      <div className={styles.cardsList}>
        {packages.map((pkg) => {
          const sessions = (pkg.sessions ?? []) as PackageSession[];
          const isLimitedTime = pkg.limited_time === "1";

          return sessions.map((session) => {
            const isSub = isSubscriptionSession(session);
            const checkoutHref = isLimitedTime
              ? `/checkout/limited-time-offer?${new URLSearchParams({
                  course_id: convertCourseCodeToId(courseCode),
                  package_id: String(pkg.package_id),
                  session_id: String(session.session_id),
                  amount: String(Math.round(Number(session.price) * 100)),
                  mode: isSub ? "subscription" : "one_time",
                  title: `Summer ${getFriendlyCourseName(courseCode)} ${FRIENDLY_PACKAGE_TYPE[currentService]}`,
                  tutoring_type: FRIENDLY_PACKAGE_TYPE[currentService],
                }).toString()}`
              : undefined;

            return (
              <CoursePricingCard
                key={session.session_id}
                session={session}
                packageId={pkg.package_id}
                courseCode={courseCode}
                limitedTime={isLimitedTime}
                checkoutHref={checkoutHref}
              />
            );
          });
        })}
      </div>

      <p className={styles.noteText}>
        {isSelfStudy ? (
          <>
            <span className={styles.noteLabel}>NOTE:</span> Your subscription
            renews automatically each billing cycle. Cancel anytime.
          </>
        ) : (
          <>
            <span className={styles.noteLabel}>NOTE:</span> 24 hrs advance notice
            required to cancel or reschedule a session.
          </>
        )}
      </p>

      <Link
        href={`/package-details/${currentService}/${courseCode}`}
        className={`text-decoration-none ${styles.detailsBtn}`}
      >
        {SERVICE_CTA_LABELS[currentService]}
      </Link>
    </div>
  );
}
