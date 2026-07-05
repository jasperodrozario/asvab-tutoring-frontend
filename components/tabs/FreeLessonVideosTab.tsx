import React from "react";
import styles from "@/components/course/CourseOverviewVideoEmbed.module.css";

export interface VideoObject {
  video_title?: string | string[];
  video_link?: string | string[];
  thumb_pic?: string | string[];
}

interface VideoTabProps {
  video?: VideoObject;
}

const FreeLessonVideosTab: React.FC<VideoTabProps> = ({ video }) => {
  let videoArray: string[] = [];

  if (video) {
    if (typeof video.video_link === "string") {
      videoArray = video.video_link
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
    } else if (Array.isArray(video.video_link)) {
      videoArray = video.video_link
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0);
    } else if (Array.isArray(video)) {
      videoArray = (video as any)
        .map((x: any) => String(x).trim())
        .filter((x: any) => x.length > 0);
    }

    if (videoArray.length === 0) {
      return (
        <div className="instructor-content">
          <div className="row">
            <div
              className="col-12 text-center"
              style={{
                padding: "40px 20px",
                color: "#6c757d",
                fontSize: "1.1rem",
              }}
            >
              <p>No video available to view at the moment.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="instructor-content">
        <div className="row">
          {videoArray.map((url, index) => (
            <div key={index} className="col-12 mb-4">
              <div className={`${styles.card} ${styles.wrapper}`}>
                <div className={styles.frame}>
                  <iframe
                    className={styles.iframe}
                    src={url}
                    title={`Free lesson video player ${index + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default FreeLessonVideosTab;
