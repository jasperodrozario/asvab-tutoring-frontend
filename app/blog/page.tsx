"use client";
import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Link from "next/link";

interface Blog {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  written_by: string;
  writer_img: string;
  created_at: string;
}

/* ================= HELPERS ================= */

// Decode HTML entities (also handles double-encoding)
function decodeHtmlEntities(html: string): string {
  if (typeof window === "undefined") return html;

  const textarea = document.createElement("textarea");
  let prev = "";
  let cur = html ?? "";

  for (let i = 0; i < 6 && cur !== prev; i++) {
    prev = cur;
    textarea.innerHTML = cur;
    cur = textarea.value;
  }

  return cur;
}

// Convert HTML -> plain text (no tags)
function htmlToText(html: string): string {
  if (typeof window === "undefined") return html;

  const decoded = decodeHtmlEntities(html || "");
  const doc = new DOMParser().parseFromString(decoded, "text/html");

  let text = doc.body.textContent || "";
  text = text.replace(/\u00A0/g, " "); // &nbsp; -> space
  text = text.replace(/\s+/g, " ").trim(); // collapse whitespace

  return text;
}

function makeExcerpt(html: string, max = 120): string {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "...";
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
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "get-blogs",
            page_no: page.toString(),
          }),
        });

        // Safer parsing (prevents JSON parse crashes if server returns HTML/text)
        const raw = await res.text();
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          console.error("get-blogs returned non-JSON:", raw);
          setBlogs([]);
          setTotalPages(1);
          return;
        }

        if (data?.isSuccess) {
          setBlogs(Array.isArray(data.data) ? data.data : []);
          setTotalPages(Number(data.total_pages) || 1);
        } else {
          setBlogs([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setBlogs([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    fetchBlogs();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const getPaginationRange = () => {
    const delta = 2;
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
    <section>
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded-bottom flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">Blog</h1>
        <Breadcrumb segments={["blog"]} className="text-white text-base mt-1" />
      </div>

      {/* Blog Grid */}
      <div className="container">
        <div className="row g-4">
          {loading ? (
            <div className="text-center py-5">Loading blogs...</div>
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog.blog_id} className="col-md-6 col-lg-4">
                <Link href={`/blog-detail/${blog.blog_id}`}>
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
                          {new Date(blog.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </small>
                      </div>

                      {/* ✅ Blog Excerpt (NO HTML TAGS) */}
                      <p className="card-text px-4">
                        {makeExcerpt(blog.blog_content, 120)}
                      </p>

                      {/* Read More – FIXED POSITION */}
                      <div className="text-center mt-auto">
                        <button className="btn btn-primary-custom my-3 px-3 py-2 text-nowrap">
                          Continue Reading
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
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
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  &laquo; Prev
                </button>
              </li>

              {getPaginationRange().map((p, index) =>
                typeof p === "number" ? (
                  <li key={index} className="page-item">
                    <button
                      className={`page-link ${
                        p === page ? "bg-custom-primary text-white" : ""
                      }`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  </li>
                ) : (
                  <li key={index} className="page-item disabled">
                    <span className="page-link">…</span>
                  </li>
                ),
              )}

              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
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
