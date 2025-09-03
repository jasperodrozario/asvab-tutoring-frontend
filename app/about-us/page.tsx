// app/about-us/page.tsx
import React from 'react';

type AboutItem = {
  id: number | string;
  title: string;
  description: string;
};

// Server-side fetch with caching only per request
async function fetchAboutUsData(): Promise<AboutItem[]> {
  try {
    const response = await fetch(
      'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'get-about-us' }),
        cache: 'force-cache', // same as How It Works
      }
    );

    const data = await response.json();
    return data?.isSuccess ? (data.data as AboutItem[]) : [];
  } catch (error) {
    console.error('Failed to fetch About Us content:', error);
    return [];
  }
}

// Force server rendering
export const dynamic = 'force-dynamic';

export default async function AboutUsPage() {
  const aboutItems = await fetchAboutUsData();

  return (
    <section>
      <div className="banner">
        <h1 className="text-white text-center bg-black bg-opacity-50 py-3 px-4 rounded">
          About us
        </h1>
      </div>

      <div className="container py-5">
        <h2 className="mb-1">About us</h2>
        <hr className="mb-4 mt-2" />

        {aboutItems.length > 0 ? (
          aboutItems.map((item: AboutItem) => (
            <div key={item.id} className="mb-4">
              <h5 className="text-dark">{item.title}</h5>
              <p className="text-secondary">{item.description}</p>
            </div>
          ))
        ) : (
          <p className="text-muted">
            No about us information available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
