// components/specific-packages/specificPackages.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Submenu = "one" | "group" | "subscribe";

interface CourseItem {
  course_id: string;
  course_code: string;
  name: string;
  image_src: string;
  price_range: string;
}

type Props = {
  submenu: Submenu;
};

const PricingPackages: React.FC<Props> = ({ submenu }) => {
  const [packages, setPackages] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submenu) return;
    setLoading(true);

    const fetchPackages = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "specific-course-list-tutoring-package");
        formData.append("submenu", submenu); // same API, different submenu value

        const res = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          { method: "POST", body: formData }
        );
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
  }, [submenu]);

  const headingText =
    submenu === "one" ? "1-on-1 Tutoring Packages" : submenu === "group" ? "Group Tutoring Packages" : "Subscribe Packages";

  const subText =
    submenu === "one"
      ? "Choose from our personalized 1-on-1 tutoring packages."
      : submenu === "group"
      ? "Select from our group tutoring options."
      : "Choose a subscription plan for full access to materials and resources.";

  return (
    <section className="bg-white py-5 text-center">
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-5 position-relative">
          <h2 className="fs-2 fw-bold d-inline-block pb-3 position-relative">
            {headingText}
            <Image
              src="/images/border_v1.png"
              alt="underline"
              width={160}
              height={8}
              className="position-absolute start-50 translate-middle-x bottom-0"
              style={{ objectFit: "cover" }}
            />
          </h2>
        </div>

        {/* Description */}
        <p className="text-start mx-auto mb-4" style={{ maxWidth: "960px" }}>
          {subText}
        </p>

        {/* Cards */}
        <div className="row justify-content-center g-4 mb-5">
          {loading ? (
            <p>Loading packages...</p>
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.course_id} className="col-sm-6 col-lg-3 hover-lift">
                <div className="card h-100 shadow-sm border-0">
                  <Image
                    src={encodeURI(pkg.image_src.trim())}
                    alt={pkg.name}
                    width={400}
                    height={200}
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body text-start">
                    <h5 className="card-title fw-bold text-primary">{pkg.name}</h5>
                    <p className="card-text fw-semibold">{pkg.price_range}</p>
                    <div className="text-center">
                      {/* route to detail page including submenu param */}
                      <Link href={`/SpecificPackageDetailsPage/${submenu}/${pkg.course_id}`} className="btn btn-secondary-custom btn-sm w-50">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
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
