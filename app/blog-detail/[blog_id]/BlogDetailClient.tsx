"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

/* ================= TYPES ================= */

interface BlogDetail {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  written_by: string;
  writer_img: string;
  created_at: string;
}

/* ================= HTML DECODE ================= */
/** Handles single + double encoded HTML */
function decodeHtml(html: string): string {
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

/* ================= COMPONENT ================= */

export default function BlogDetailClient({ blog_id }: { blog_id: string }) {
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "get-blog-details",
            blog_id,
          }),
          cache: "no-store",
        });

        const data = await res.json();

        if (data?.isSuccess && data.data) {
          setBlog(data.data as BlogDetail);
        } else {
          setBlog(null);
        }
      } catch (err) {
        console.error("Failed to fetch blog:", err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [blog_id]);

  if (loading) {
    return <p className="text-center py-5">Loading blog…</p>;
  }

  if (!blog) {
    return (
      <div className="container py-5 text-center">
        <h4>Blog not found</h4>
      </div>
    );
  }

  return (
    <section className="bg-light">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">
          {blog.blog_title}
        </h1>
        <Breadcrumb
          segments={["blog", "blog-detail"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* Content */}
      <div className="container py-4">
        <div className="card shadow-sm border-0 p-4">
          {/* Author */}
          <div className="d-flex align-items-center mb-4">
            <img
              src={
                blog.writer_img?.startsWith("http")
                  ? blog.writer_img
                  : `https://staging-test-prep.asvab-tutoring.com/practice-test/${blog.writer_img}`
              }
              alt={blog.written_by}
              width={40}
              height={40}
              className="rounded-circle me-2"
            />
            <div>
              <h6 className="mb-0 text-capitalize">{blog.written_by}</h6>
              <small>
                {new Date(blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </div>
          </div>

          {/* Blog Content */}
          <div
            className="lh-lg blog-content"
            dangerouslySetInnerHTML={{
              __html: decodeHtml(blog.blog_content || ""),
            }}
          />
        </div>
      </div>
    </section>
  );
}
