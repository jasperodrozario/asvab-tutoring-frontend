import { Metadata } from "next";
import { notFound } from "next/navigation";
import { isKnownBlogId } from "@/lib/known-route-validation";
import BlogDetailClient from "./BlogDetailClient";

type Props = {
  params: Promise<{ blog_id: string; blog_title: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blog_id } = await params;

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
      return {
        title: `${blog.blog_title} | ASVAB Tutoring Blog`,
        description:
          blog.blog_content
            ?.replace(/<[^>]*>/g, "")
            ?.slice(0, 160)
            ?.trim() + "...",
        openGraph: {
          title: blog.blog_title,
          description: blog.blog_content?.replace(/<[^>]*>/g, "").slice(0, 160),
          type: "article",
          publishedTime: blog.created_at,
          authors: [blog.written_by],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Blog Detail | ASVAB Tutoring",
    description: "Read the latest news and updates from ASVAB Tutoring.",
  };
}

export default async function Page({ params }: Props) {
  const { blog_id } = await params;

  if (!isKnownBlogId(blog_id)) {
    notFound();
  }

  return <BlogDetailClient blog_id={blog_id} />;
}
