"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type WelcomeItem = {
  id: string;
  title: string;
  description: string;
};

// HTML decode function
function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function WelcomeSection() {
  const [welcome, setWelcome] = useState<WelcomeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchWelcomeText() {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "get-welcome-text",
          }),
        });

        const data = await response.json();

        if (
          data?.isSuccess &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setWelcome(data.data[0]);
        } else {
          setWelcome(null);
        }
      } catch (error) {
        console.error("Failed to fetch welcome text:", error);
        setWelcome(null);
      } finally {
        setLoading(false);
      }
    }

    fetchWelcomeText();
  }, []);

  return (
    <section className="py-5 bg-white px-3">
      <div className="container">
        <div className="text-center position-relative">
          <h2 className="fw-bold display-5 text-dark position-relative d-inline-block pb-3">
            {loading ? "Loading..." : welcome?.title || "Welcome"}

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

        <div className="mt-4 fs-5">
          {loading ? (
            <p className="text-center text-muted">Loading welcome content...</p>
          ) : welcome ? (
            <div
              className="fs-6"
              dangerouslySetInnerHTML={{
                __html: decodeHtml(welcome.description),
              }}
            />
          ) : (
            <p className="text-center text-muted">
              Welcome content is not available at the moment.
            </p>
          )}
        </div>

        <div className="text-center">
          <Link href="/about-us">
            <button className="btn btn-primary-custom mt-4 px-5 py-2">
              READ MORE
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
