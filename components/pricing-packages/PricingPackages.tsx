"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ServiceType } from "@/types/Services";
import type { PricingPackageItem } from "@/lib/php-api";

type Submenu = "one" | "group" | "subscribe";

type Props = {
  submenu?: Submenu;
  fixedSubmenu?: Submenu;
  homepageDescription?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  /** Server-fetched packages (pricing pages). Homepage omits this and client-fetches. */
  initialPackages?: PricingPackageItem[];
};

const PricingPackages: React.FC<Props> = ({
  submenu,
  fixedSubmenu = "one",
  homepageDescription,
  sectionTitle,
  sectionSubtitle,
  initialPackages,
}) => {
  const [packages, setPackages] = useState<PricingPackageItem[]>(
    initialPackages ?? [],
  );
  const [loading, setLoading] = useState(initialPackages === undefined);

  const activeSubmenu: Submenu = submenu ?? fixedSubmenu;

  const serviceTypeMap: Record<Submenu, ServiceType> = {
    one: "1-on-1-tutoring",
    group: "group-tutoring",
    subscribe: "self-study",
  };

  const serviceType = serviceTypeMap[activeSubmenu] ?? null;

  useEffect(() => {
    if (initialPackages !== undefined) {
      return;
    }

    setLoading(true);

    const fetchPackages = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "specific-course-list-tutoring-package");
        formData.append("submenu", activeSubmenu);

        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data?.isSuccess && Array.isArray(data.data)) {
          setPackages(data.data);
        } else {
          setPackages([]);
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [activeSubmenu, initialPackages]);

  // ---------------- TITLES ----------------

  // Default titles for pricing pages (and as fallback)
  const defaultTitleMap: Record<Submenu, string> = {
    one: "1-on-1 Tutoring Packages",
    group: "Group Tutoring Packages",
    subscribe: "Self-Study Packages",
  };

  const subTextMap: Record<Submenu, string> = {
    one: "Choose from our personalized 1-on-1 tutoring packages.",
    group: "Choose from one of our group tutoring packages.",
    subscribe:
      "Choose a self-study plan for full access to study materials and practice tests.",
  };

  // ✅ Final heading logic:
  // 1) If sectionTitle is provided (homepage section), use it
  // 2) Else use default map (pricing pages)
  const headingText = sectionTitle ?? defaultTitleMap[activeSubmenu];
  const subText = subTextMap[activeSubmenu];

  return (
    <section className="bg-white mt-5 text-center">
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-2 position-relative">
          <h2 className="fs-2 fw-bold d-inline-block pb-3 position-relative">
            {headingText}
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

        {/* ✅ Optional subtitle (useful for homepage subscribe section etc.) */}
        {sectionSubtitle && (
          <h3 className="fs-5 fw-semibold text-muted mb-3">
            {sectionSubtitle}
          </h3>
        )}

        {/* Description:
            - If homepageDescription exists, show that
            - Otherwise use submenu-based description (pricing pages)
        */}
        {/* Homepage description (if provided) */}
        {homepageDescription && (
          <p className="text-start mx-auto mb-4" style={{ maxWidth: "960px" }}>
            {homepageDescription}
          </p>
        )}

        {/* Always show subText after homepageDescription (or alone on pricing page) */}
        <p className="text-start mx-auto mb-4 fs-5">{subText}</p>

        {/* Cards */}
        <div className="row justify-content-center g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {loading ? (
            <p>Loading packages...</p>
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.course_id} className="col hover-lift">
                <Link
                  href={`/package-details/${serviceType}/${pkg.course_code}`}
                >
                  <div className="card h-100 shadow-sm border-0">
                    <Image
                      src={encodeURI(pkg.image_src.trim())}
                      alt={pkg.name}
                      width={400}
                      height={250}
                      className="card-img-top"
                      style={{
                        width: "100%",
                        height: "auto",
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                      }}
                    />

                    {/* <div
                      className={`card-body text-start ${fixedSubmenu === "subscribe" ? "text-center" : ""}`}
                    > */}
                    <div className={`card-body text-start text-center`}>
                      <h5 className="card-title fw-bold text-primary text-center">
                        <span className="course-name">{pkg.name}</span>
                        <br />
                        <span className="course-full-form">
                          {pkg.full_form}
                        </span>
                      </h5>

                      <p className="card-text fw-semibold">
                        {(pkg.price_range ?? "")
                          .split(" (")
                          .map((part: string, i: number) => (
                            <React.Fragment key={i}>
                              {i > 0 && <br />}
                              {i > 0 ? `(${part}` : part}
                            </React.Fragment>
                          ))}
                      </p>

                      <div className="text-center">
                        <button className="btn btn-secondary-custom btn-sm w-50">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p>No packages found for this category.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingPackages;
