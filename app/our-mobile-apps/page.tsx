"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface AppInfo {
  app_id: string;
  logo_img: string;
  app_name: string;
  app_description: string;
  app_store_url: string;
  google_play_url: string;
}

export default function OurAppsPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "get-our-app-info");

        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        // Checking for error in response (temp)
        if (!res.ok) {
          const text = await res.text(); // Read as text to see what's actually returned
          console.error("API Error:", text);
          return;
        }

        const data = await res.json();
        if (data?.isSuccess) {
          setApps(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch apps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-center py-5">Loading apps...</p>
      </div>
    );
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">Our Mobile Apps</h2>
        <div className="row g-4">
          {apps.map((app) => (
            <div className="col-md-6" key={app.app_id}>
              <div className="app-card h-100 shadow-sm text-center p-3">
                {/* App Logo */}
                <div className="app-logo mb-3">
                  <Image
                    src={app.logo_img}
                    alt={app.app_name}
                    width={100}
                    height={100}
                    className="img-fluid rounded"
                  />
                </div>

                {/* App Name */}
                <h5 className="app-name mb-3">{app.app_name}</h5>

                {/* App Description */}
                <p className="app-description"> {app.app_description} </p>

                {/* App Store & Google Play */}
                <div className="d-flex justify-content-center gap-3">
                  {app.app_store_url && app.app_store_url !== "dummy" && (
                    <Link
                      href={app.app_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-link-btn"
                    >
                      <Image
                        src="/images/download-on-the-app-store.svg"
                        alt="App Store"
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: "auto", height: "40px" }}
                      />
                    </Link>
                  )}

                  {app.google_play_url && app.google_play_url !== "dummy" && (
                    <Link
                      href={app.google_play_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-link-btn"
                    >
                      <Image
                        src="/images/Google_Play_Store_badge_EN.svg"
                        alt="Google Play"
                        width={0}
                        height={0}
                        sizes="100vw"
                        style={{ width: "auto", height: "40px" }}
                      />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
