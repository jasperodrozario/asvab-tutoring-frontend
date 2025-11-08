"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";



interface CourseItem {
  course_id: string;
  course_code: string;
  name: string;
  image_src: string;
  price_range: string;
}

const PricingPackages: React.FC = () => {
  const searchParams = useSearchParams();
  const submenu = searchParams.get("submenu") === "group" ? "group" : "one"; // default = one

  const [packages, setPackages] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "specific-course-list-tutoring-package");
        formData.append("submenu", submenu);

        const response = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          { method: "POST", body: formData }
        );

        const data = await response.json();

        if (data?.isSuccess && Array.isArray(data.data)) {
          setPackages(data.data);
        } else {
          console.warn("No packages found for submenu:", submenu);
          setPackages([]);
        }
      } catch (error) {
        console.error("Error fetching pricing packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [submenu]);

  return (
    <section className="bg-white py-5 text-center">
      <div className="container">
        {/* 🔹 Heading */}
        <div className="text-center mb-5 position-relative">
          <h2 className="fs-2 fw-bold text-gray-800 d-inline-block pb-3 position-relative">
            {submenu === "one"
              ? "1-on-1 Tutoring Packages"
              : "Group Tutoring Packages"}
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

        {/* 🔹 Description */}
        <p
          className="text-secondary text-start mx-auto mb-4"
          style={{ maxWidth: "960px" }}
        >
          {submenu === "one"
            ? "Choose from our personalized 1-on-1 tutoring packages tailored to your learning goals. Each session is 2 hours long and includes full lesson plans with study materials."
            : "Select from our group tutoring options for collaborative learning at an affordable rate. Each session is 2 hours long with shared resources and expert guidance."}
        </p>

        {/* 🔹 Package Cards */}
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
                    <h5 className="card-title fw-bold text-primary">
                      {pkg.name}
                    </h5>
                    <p className="card-text text-secondary fw-semibold">
                      {pkg.price_range}
                    </p>
                    <div className="text-center">
                      <Link
                        href={`/SpecificPackageDetailsPage/${submenu}/${pkg.course_id}`}
                        className="btn btn-secondary-custom btn-sm w-50"
                      >
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
