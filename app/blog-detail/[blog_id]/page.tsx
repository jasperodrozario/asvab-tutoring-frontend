import React from "react";
import Image from "next/image";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

// ✅ Define the data shape
interface BlogDetail {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  written_by: string;
  writer_img: string;
  created_at: string;
}

// ✅ Server-side fetch
async function fetchBlogDetail(blog_id: string): Promise<BlogDetail | null> {
  try {
    const res = await fetch(
      "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "get-blog-details",
          blog_id,
        }),
        cache: "no-store",
      }
    );

    const data = await res.json();
    if (data?.isSuccess && data.data) {
      return data.data as BlogDetail;
    }
    return null;
  } catch (error) {
    console.error("Error fetching blog details:", error);
    return null;
  }
}

// ✅ Force server-side rendering
export const dynamic = "force-dynamic";

// ✅ Page component (Next.js 15)
export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ blog_id: string }>;
}) {
  const { blog_id } = await params;
  const blog = await fetchBlogDetail(blog_id);

  if (!blog) {
    return (
      <div className="container py-5 text-center">
        <h4>Blog not found</h4>
      </div>
    );
  }

  return (
    <section className="bg-light">
      {/* ✅ Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        {/* Page Title */}
        <h1 className="text-white mb-2 text-3xl font-bold">
          {blog.blog_title}
        </h1>

        {/* ✅ Breadcrumb below title */}
        <Breadcrumb
          segments={["blog", "blog-detail"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* ✅ Blog Content */}
      <div className="container py-4">
        <div className="card shadow-sm border-0 p-4">
          {/* Header (Title + Author Info) */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center">
              <Image
                src={
                  blog.writer_img?.startsWith("http")
                    ? blog.writer_img
                    : `https://test-prep.asvab-tutoring.com/practice-test/${blog.writer_img}`
                }
                alt={blog.written_by}
                width={40}
                height={40}
                className="rounded-circle me-2"
              />
              <div>
                <h6 className="mb-0 text-capitalize">{blog.written_by}</h6>
                <small className=" ">
                  {new Date(blog.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </small>
              </div>
            </div>
          </div>

          {/* Blog Content */}
          <div
            className="lh-lg"
            dangerouslySetInnerHTML={{ __html: blog.blog_content }}
          ></div>
        </div>
      </div>
    </section>
  );
}
