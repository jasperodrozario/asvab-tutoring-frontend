"use client";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";


interface Blog {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  written_by: string;
  writer_img: string;
  created_at: string;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true);
      try {
        const res = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              action: "get-blogs",
              page_no: page.toString(),
            }),
          }
        );

        const data = await res.json();
        if (data?.isSuccess) {
          setBlogs(data.data || []);
          setTotalPages(data.total_pages || 1);
        } else {
          setBlogs([]);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setBlogs([]);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top on page change
      }
    }

    fetchBlogs();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Generate windowed pagination
  const getPaginationRange = () => {
    const delta = 2; // pages before and after current
    const range: (number | string)[] = [];
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  return (
    <section className="bg-light">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        {/* Page Title */}
        <h1 className="text-white mb-2 text-3xl font-bold">
          Blog
        </h1>

        {/* Breadcrumb below title */}
        <Breadcrumb
          segments={["blog"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Blog Grid */}
      <div className="container">
        <div className="row g-4">
          {loading ? (
            <div className="text-center py-5">Loading blogs...</div>
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog.blog_id} className="col-md-6 col-lg-4">
                <div className="card hover-lift shadow cursor-pointer h-100 border-0">
  <div className="card-body d-flex flex-column">

    <h5 className="card-title mb-2 py-4 px-4">
      {blog.blog_title}
    </h5>

    {/* Author + Date */}
    <div className="d-flex justify-content-between align-items-center mb-3 px-4">
      <div className="d-flex align-items-center">
        <img
          src={
            blog.writer_img &&
            !blog.writer_img.includes("image.php?src")
              ? blog.writer_img
              : "/images/author_blog.png"
          }
          className="rounded-circle me-2"
          alt="Author"
          width="30"
          height="30"
        />
        <small>{blog.written_by || "Unknown Author"}</small>
      </div>

      <small className="text-end">
        {new Date(blog.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </small>
    </div>

    {/* Blog Excerpt */}
    <p className="card-text px-4">
      {blog.blog_content.length > 120
        ? blog.blog_content.slice(0, 120) + "..."
        : blog.blog_content}
    </p>

    {/* Read More – FIXED POSITION */}
    <div className="text-center mt-auto">
      <a
        href={`/blog-detail/${blog.blog_id}`}
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <nav className="mt-5">
            <ul className="pagination justify-content-center">
              {/* Prev Button */}
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  &laquo; Prev
                </button>
              </li>

              {/* Dynamic Page Range */}
              {getPaginationRange().map((p, index) =>
                typeof p === "number" ? (
                  <li
                    key={index}
                    className={`page-item`}
                  >
                    <button
                      className={`page-link ${p === page ? "bg-custom-primary text-white" : ""}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  </li>
                ) : (
                  <li key={index} className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                )
              )}

              {/* Next Button */}
              <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next &raquo;
                </button>
              </li>
            </ul>
          </nav>
        )}

      </div>
    </section>
  );
}
