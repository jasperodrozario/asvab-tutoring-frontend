// app/about-us/page.tsx
import React from 'react';

async function fetchHowItWorkPageData() {
  try {
    const response = await fetch('https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ action: 'get-how-it-works' }),
      // `cache: 'no-store'` disables static rendering to make sure it's dynamic
      cache: 'no-store',
    });

    const data = await response.json();
    return data?.isSuccess ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch How it works page content:', error);
    return [];
  }
}

export default async function HowItWorkPage() {
  const aboutItems = await fetchHowItWorkPageData();

  return (
    <section>
      {/* Banner */}
      <div className="banner">
        <h1 className="text-white text-center bg-black bg-opacity-50 py-3 px-4 rounded">
         How it works
        </h1>
      </div>

      {/* Content */}
      <div className="container py-5">
        <h2 className="mb-1">How it works</h2>
        <hr className="mb-4 mt-2" />

        {aboutItems.length > 0 ? (
          aboutItems.map((item: any) => (
            <div key={item.id} className="mb-4">
              <h5 className="text-dark">{item.title}</h5>
              <p className="text-secondary">{item.description}</p>
            </div>
          ))
        ) : (
          <p className="text-muted">No how it works page content information available at the moment.</p>
        )}
      </div>
    </section>
  );
}
