// app/how-it-works/page.tsx
"use client";
import React from 'react';

// Define the type for each item
type HowItWorkItem = {
  id: number | string;
  title: string;
  description: string;
};

// Fetch function with typed return
async function fetchHowItWorkPageData(): Promise<HowItWorkItem[]> {
  try {
    const response = await fetch(
      'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ action: 'get-how-it-works' }),
        cache: 'no-store', // disables static rendering for dynamic content
      }
    );

    const data = await response.json();

    // Ensure the return type matches HowItWorkItem[]
    return data?.isSuccess ? (data.data as HowItWorkItem[]) : [];
  } catch (error) {
    console.error('Failed to fetch How it works page content:', error);
    return [];
  }
}

// Main page component
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
          aboutItems.map((item: HowItWorkItem) => (
            <div key={item.id} className="mb-4">
              <h5 className="text-dark">{item.title}</h5>
              <p className="text-secondary">{item.description}</p>
            </div>
          ))
        ) : (
          <p className="text-muted">
            No how it works page content information available at the moment.
          </p>
        )}
      </div>
    </section>
  );
}
