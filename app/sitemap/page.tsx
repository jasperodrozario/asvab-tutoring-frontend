"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SitemapItem {
  course_id: string;
  course_name: string;
  name: string;
}

export default function SitemapPage() {
  const [items, setItems] = useState<SitemapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch("https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ action: "get-sitemap" }),
        });

        const result = await response.json();
        if (result.isSuccess && result.data) {
          setItems(result.data);
        }
      } catch (error) {
        console.error("Error fetching sitemap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) return <p className="text-center mt-4">Loading sitemap...</p>;

  return (
    <div className="container py-5">
      {/* Header */}
      <h1 className="text-center text-white py-3 mb-5" style={{ backgroundColor: "#f2a155", borderRadius: "6px" }}>
        Sitemap
      </h1>

      {/* 3-column grid */}
      <div className="row g-3">
        {items.map((item, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <Link 
              href={`/course-detail/${item.course_id}`} 
              className="d-block text-decoration-none p-3 h-100 shadow-sm rounded bg-light text-dark hover-link"
            >
              {item.name}
              {/* <div className="text-muted small">{item.course_name}</div> */}
            </Link>
          </div>
        ))}
      </div>

      {/* Extra CSS for hover effect */}
      <style jsx>{`
        .hover-link:hover {
          background-color: #e7f1ff;
          color: #0d6efd;
        }
      `}</style>
    </div>
  );
}
