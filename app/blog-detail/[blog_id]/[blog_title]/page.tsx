import { Metadata } from "next";
import BlogDetailClient from "./BlogDetailClient";
import {
  blogDetailMetadata,
  BLOG_DETAIL_FALLBACK_SEO,
} from "@/lib/page-metadata";

type Props = {
  params: Promise<{ blog_id: string; blog_title: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blog_id, blog_title } = await params;

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
    });

    const data = await res.json();

    if (data?.isSuccess && data.data) {
      const blog = data.data;
      const description =
        blog.blog_content
          ?.replace(/<[^>]*>/g, "")
          ?.slice(0, 160)
          ?.trim() + "...";

      return blogDetailMetadata(blog_id, blog_title, {
        title: `${blog.blog_title} | ASVAB Tutoring Blog`,
        description,
      }, {
        title: blog.blog_title,
        description: blog.blog_content?.replace(/<[^>]*>/g, "").slice(0, 160),
        type: "article",
        publishedTime: blog.created_at,
        authors: [blog.written_by],
      });
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return blogDetailMetadata(
    blog_id,
    blog_title,
    BLOG_DETAIL_FALLBACK_SEO,
  );
}

export default async function Page({ params }: Props) {
  const { blog_id } = await params;
  return <BlogDetailClient blog_id={blog_id} />;
}
