"use client";

import { useEffect, useState } from "react";
import type { CourseOverviewVideo } from "@/lib/php-api";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import styles from "./CourseOverviewVideoEmbed.module.css";

type Props = {
  video: CourseOverviewVideo;
  fallbackImageSrc?: string;
  fallbackImageAlt?: string;
  className?: string;
};

function resolveEmbedUrl(
  video: CourseOverviewVideo,
  isMobile: boolean,
): string {
  const primaryLink = isMobile
    ? video.mobile_youtube_link
    : video.desktop_youtube_link;
  const fallbackLink = isMobile
    ? video.desktop_youtube_link
    : video.mobile_youtube_link;

  return getYouTubeEmbedUrl(primaryLink) || getYouTubeEmbedUrl(fallbackLink);
}

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

  const embedUrl = resolveEmbedUrl(video, isMobile);

  if (embedUrl) {
    return (
      <div className={`${className} ${styles.wrapper}`}>
        <div className={styles.frame}>
          <iframe
            className={styles.iframe}
            src={embedUrl}
            title="Course Overview Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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
