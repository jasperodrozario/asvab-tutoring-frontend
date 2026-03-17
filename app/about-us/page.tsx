"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

/* ================= TYPES ================= */

type AboutItem = {
  id: number | string;
  title: string;
  description: string;
};

/* ================= HTML DECODE ================= */

function decodeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

/* ================= PAGE ================= */

export default function AboutUsPage() {
  const [items, setItems] = useState<AboutItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAboutUs() {
      try {
        const res = await fetch(process.env.PHP_API_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "get-about-us",
          }),
        });

        const data = await res.json();

        if (data?.isSuccess && Array.isArray(data.data)) {
          setItems(data.data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch About Us content:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutUs();
  }, []);

  return (
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center">
        <h1 className="text-white mb-2 text-3xl font-bold">About Us</h1>
        <Breadcrumb
          segments={["about-us"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container pb-5 py-5">
        {loading ? (
          <p className="text-center">Loading about us information…</p>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="mb-5">
              <h2 className="text-dark mb-3">{item.title}</h2>
              <hr className="mb-4 mt-2" />
              <div
                dangerouslySetInnerHTML={{
                  __html: decodeHtml(item.description),
                }}
              />
            </div>
          ))
        ) : (
          <p className="text-center">
            No about us information available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
