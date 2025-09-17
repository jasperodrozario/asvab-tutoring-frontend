// app/blog/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Blog {
  id: string;
  name: string;
  author_details: string;
  pic: string;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ action: "get-blog" }),
          }
        );
        const data = await res.json();
        if (data?.isSuccess) {
          setBlogs(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <section className="bg-light">
      {/* ✅ Banner (static) */}
      <div className="banner mb-5">
        <h1 className="text-white text-center bg-black bg-opacity-50 py-3 px-4 rounded">
          BLOG
        </h1>
      </div>

      {/* ✅ Blog Grid */}
      <div className="container">
        <div className="row g-4">
          {loading ? (
            <div className="text-center py-5">Loading blogs...</div>
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog.id} className="col-md-6 col-lg-4">
                <div className="card hover-lift shadow cursor-pointer h-100 border-0">
                  <div className="card-body">
                    <h5 className="card-title mb-2 py-4 px-4">{blog.name}</h5>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            blog.pic
                              ? `https://test-prep.asvab-tutoring.com/practice-test/${blog.pic}`
                              : "/images/author_blog.png"
                          }
                          className="rounded-circle me-2"
                          alt="Author"
                          width="30"
                          height="30"
                        />
                        <small className="text-muted">
                          {blog.author_details}
                        </small>
                      </div>
                    </div>
                    <p className="card-text text-secondary">
                    
                      {blog.name.length > 120
                        ? blog.name.slice(0, 120) + "..."
                        : blog.name}
                    </p>
                    <div className="text-center">
                      <a
                        href={`/blog/${blog.id}`}
                        className="btn btn-primary-custom mt-4 px-3 py-1 text-nowrap"
                      >
                        CONTINUE READING
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5">No blogs found.</div>
          )}
        </div>

        {/* ✅ Pagination (static for now) */}
        <nav className="mt-5">
          <ul className="pagination justify-content-center">
            <li className="page-item active">
              <a className="page-link" href="#">
                1
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                2
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                3
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                ›
              </a>
            </li>
            <li className="page-item">
              <a className="page-link" href="#">
                »
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  );
}
