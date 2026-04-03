"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Button from "../button/Button";

/* ================= TYPES ================= */

type ServiceDetail = {
  service_id: string;
  title: string;
  is_online: string;
  course_name: string;
  course_id: string;
  ord: string;
  description: string;
  service_type: string;
};

/* ================= HTML DECODE ================= */

function decodeHtml(html: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

/* ================= COMPONENT ================= */

export default function ServiceDetailContent({
  serviceId,
  serviceType,
}: {
  serviceId: string;
  serviceType: string;
}) {
  const [data, setData] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "get-specific-service-detail",
            service_id: serviceId,
          }),
        });

        const json = await res.json();

        if (json?.isSuccess && json.data) {
          setData(json.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Service detail fetch failed:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <p>Loading service details…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-5 text-center">
        <h3>Service details not found.</h3>
      </div>
    );
  }

  const pageTitle = data.title || "Service Detail";

  return (
    <>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded text-center mb-4">
        <h1 className="text-white mb-2 text-3xl fw-bold">{pageTitle}</h1>

        <Breadcrumb
          segments={["services", data.service_id]}
          dynamicTitle={pageTitle}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container">
        <div className="mb-4">
          <h4 className="fw-semibold">{data.course_name}</h4>
        </div>

        <div
          className="service-description"
          dangerouslySetInnerHTML={{
            __html: decodeHtml(data.description),
          }}
        />
        <div className="text-center my-4">
          <Button
            pathname={`/pricing/${serviceType}`}
            className="btn-primary-custom2"
          >
            {data.service_type === "subscribe" ? "Subscribe Now" : "Enroll Now"}
          </Button>
        </div>
      </div>
    </>
  );
}
