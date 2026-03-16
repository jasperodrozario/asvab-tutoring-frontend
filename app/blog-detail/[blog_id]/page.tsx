import BlogDetailClient from "./BlogDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ blog_id: string }>;
}) {
  const { blog_id } = await params;
  return <BlogDetailClient blog_id={blog_id} />;
}
