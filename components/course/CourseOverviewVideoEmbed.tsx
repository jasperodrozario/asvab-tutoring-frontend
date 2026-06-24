"use client";

import { useEffect, useState } from "react";
import type { CourseOverviewVideo } from "@/lib/php-api";

function getEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return url;
}

type Props = {
  video: CourseOverviewVideo;
  fallbackImageSrc?: string;
  fallbackImageAlt?: string;
  className?: string;
};

export default function CourseOverviewVideoEmbed({
  video,
  fallbackImageSrc,
  fallbackImageAlt = "Course overview",
  className = "mb-4 text-center",
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const youtubeLink = isMobile
    ? video.mobile_youtube_link
    : video.desktop_youtube_link;

  if (youtubeLink) {
    return (
      <div className={className}>
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e0e0e0",
          }}
        >
          <iframe
            src={getEmbedUrl(youtubeLink)}
            title="Course Overview Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    );
  }

  if (fallbackImageSrc) {
    return (
      <div className={className}>
        <img
          src={fallbackImageSrc}
          alt={fallbackImageAlt}
          width={800}
          height={350}
          className="img-fluid rounded shadow-sm"
        />
      </div>
    );
  }

  return null;
}
