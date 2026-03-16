'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface AppInfo {
  app_id: string;
  logo_img: string;
  app_name: string;
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
        formData.append('action', 'get-our-app-info');

        const res = await fetch(
          'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
          { method: 'POST', body: formData }
        );

        const data = await res.json();
        if (data?.isSuccess) {
          setApps(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch apps:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  if (loading) {
    return <p className="text-center py-5">Loading apps...</p>;
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">Our Mobile Apps</h2>

        <div className="row g-4">
          {apps.map((app) => (
            <div className="col-md-6" key={app.app_id}>
              <div className="card h-100 shadow-sm text-center p-3">
                {/* App Logo */}
                <div className="mb-3">
                  <img
                    src={app.logo_img}
                    alt={app.app_name}
                    width={100}
                    height={100}
                    className="img-fluid rounded"
                  />
                </div>

                {/* App Name */}
                <h5 className="fw-semibold mb-3">{app.app_name}</h5>

                {/* App Store & Google Play */}
                <div className="d-flex justify-content-center gap-3">
                  {app.app_store_url && app.app_store_url !== 'dummy' && (
                    <a
                      href={app.app_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/images/download-on-the-app-store.svg"
                        alt="App Store"
                        width={120}
                        height={40}
                      />
                    </a>
                  )}

                  {app.google_play_url && app.google_play_url !== 'dummy' && (
                    <a
                      href={app.google_play_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/images/Google_Play_Store_badge_EN.svg"
                        alt="Google Play"
                        width={120}
                        height={40}
                      />
                    </a>
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
