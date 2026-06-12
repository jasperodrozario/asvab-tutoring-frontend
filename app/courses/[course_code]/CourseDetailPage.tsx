"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cleanQuestionText } from "@/utils/textUtils";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Button from "@/components/button/Button";
import LessonPlanTab from "@/components/tabs/LessonPlanTab";
import CourseVideoTab, { VideoObject } from "@/components/tabs/CourseVideoTab";
import { processHtmlContent } from "@/lib/decode-html";
import type { CourseData, RelatedCourse } from "@/lib/course-types";
import type { CourseOverviewVideo } from "@/lib/php-api";

export type CourseDetailClientProps = {
  courseCode: string;
  courseData: CourseData | null;
  courseOverviewVideoData?: CourseOverviewVideo | null;
  location?: string;
  breadcrumbSegments: string[];
  /** How related-course sidebar links are built (serializable; no function props from RSC). */
  relatedCourseLinkVariant?: "standard" | "online";
  /** Required when relatedCourseLinkVariant is "online". */
  onlineCourseCity?: string;
};

function getRelatedCourseHref(
  course: RelatedCourse,
  variant: "standard" | "online",
  onlineCourseCity?: string,
): string {
  if (variant === "online" && onlineCourseCity) {
    return `/online-courses/${onlineCourseCity}/${encodeURIComponent(course.course_code)}-tutor`;
  }

  return `/courses/${encodeURIComponent(course.course_code)}`;
}

function formatLocationLabel(location: string): string {
  return location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;

  let videoId = "";
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export function CourseDetailClient({
  courseCode,
  courseData,
  location: locationProp = "",
  breadcrumbSegments,
  relatedCourseLinkVariant = "standard",
  onlineCourseCity,
  courseOverviewVideoData,
}: CourseDetailClientProps) {
  const searchParams = useSearchParams();
  const location = locationProp || searchParams?.get("location") || "";

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!courseData) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Failed to load course data</h4>
          <p>Please check the console or refresh the page.</p>
        </div>
      </div>
    );
  }

  const hasVideo = (() => {
    const v = courseData.video;
    if (!v) return false;
    if (typeof v === "object" && "video_link" in v) {
      const link = (v as VideoObject).video_link;
      if (typeof link === "string") return link.trim().length > 0;
      if (Array.isArray(link)) return link.length > 0;
    }
    return false;
  })();

  const hasFreeTestQuestions = (() => {
    if (!courseData.ft_cat_list?.length) return false;
    if (!courseData.ft_ques_list) return false;
    return courseData.ft_cat_list.some((cat) => {
      const questions = courseData.ft_ques_list?.[cat];
      return Array.isArray(questions) && questions.length > 0;
    });
  })();

  console.log(courseOverviewVideoData);

  return (
    <>
      <div className="page-title-area text-white py-5">
        <div className="container text-center">
          <h1>{courseData.course_header?.toUpperCase() || "Course Title"}</h1>
          <h2 className="h4">
            {courseData.course_tagline?.toUpperCase() || "Course Tagline"}
            {location && (
              <span>
                {" "}
                in <b>{formatLocationLabel(location)}</b>
              </span>
            )}
          </h2>
          <Breadcrumb
            segments={breadcrumbSegments}
            dynamicTitle={courseData.course_name}
          />
        </div>
      </div>

      <section className="single-course-area py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              {courseOverviewVideoData &&
              (isMobile
                ? courseOverviewVideoData.mobile_youtube_link
                : courseOverviewVideoData.desktop_youtube_link) ? (
                <div className="mb-4 text-center">
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                      overflow: "hidden",
                      borderRadius: "12px",
                      boxShadow:
                        "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <iframe
                      src={getEmbedUrl(
                        isMobile
                          ? courseOverviewVideoData.mobile_youtube_link
                          : courseOverviewVideoData.desktop_youtube_link,
                      )}
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
              ) : (
                courseData.image_src && (
                  <div className="mb-4 text-center">
                    <img
                      src={courseData.image_src}
                      alt={courseData.course_name || "Course Image"}
                      width={800}
                      height={350}
                      className="img-fluid rounded shadow-sm"
                    />
                  </div>
                )
              )}

              <div
                className="single-course-tab"
                style={{
                  border: "1px solid #cfd4d8",
                  borderRadius: "8px",
                  padding: "10px 18px 0px 18px",
                  marginBottom: "10px",
                  minHeight: "740px",
                }}
              >
                <ul className="nav nav-tabs mb-4 responsive-tabs">
                  {courseData.overview && courseData.overview.trim() !== "" && (
                    <li className="nav-item">
                      <button
                        className={`nav-link tab-btn ${activeTab === 0 ? "active" : ""}`}
                        onClick={() => setActiveTab(0)}
                      >
                        Overview
                      </button>
                    </li>
                  )}
                  {courseData.curriculum &&
                    courseData.curriculum.trim() !== "" && (
                      <li className="nav-item">
                        <button
                          className={`nav-link tab-btn ${activeTab === 1 ? "active" : ""}`}
                          onClick={() => setActiveTab(1)}
                        >
                          Curriculum
                        </button>
                      </li>
                    )}
                  <li className="nav-item">
                    <button
                      className={`nav-link tab-btn ${activeTab === 4 ? "active" : ""}`}
                      onClick={() => setActiveTab(4)}
                    >
                      Session Plan
                    </button>
                  </li>
                  {hasVideo && (
                    <li className="nav-item">
                      <button
                        className={`nav-link tab-btn ${activeTab === 2 ? "active" : ""}`}
                        onClick={() => setActiveTab(2)}
                      >
                        Course Video
                      </button>
                    </li>
                  )}
                </ul>

                <div className="tab-content">
                  {activeTab === 0 && (
                    <div className="overview-tab">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(
                            courseData.overview || "No description available",
                          ),
                        }}
                      />
                      {hasFreeTestQuestions && (
                        <div className="text-center mt-4">
                          <Button
                            pathname={`/courses/${encodeURIComponent(courseCode)}/free-test`}
                            className="btn-primary-custom"
                            style={{
                              padding: "10px 15px",
                              borderRadius: "5px",
                              marginBottom: "20px",
                              border: "none",
                            }}
                          >
                            Take a Free Practice Test
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 1 && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: processHtmlContent(
                          courseData.curriculum || "No curriculum",
                        ),
                      }}
                      className="curriculum-table"
                    />
                  )}
                  {activeTab === 4 && (
                    <div className="sessions-tab transition-fade">
                      <LessonPlanTab sessions={courseData.sessions} />
                    </div>
                  )}
                  {activeTab === 2 && (
                    <CourseVideoTab video={courseData.video} />
                  )}
                </div>
              </div>
              <div className="text-center">
                <Button
                  pathname={`/package-details/1-on-1-tutoring/${encodeURIComponent(courseCode)}`}
                  className="btn-primary-custom2"
                >
                  Enroll Now
                </Button>
              </div>
            </div>

            <div className="col-lg-4">
              {courseData.related_courses &&
                courseData.related_courses.length > 0 && (
                  <div
                    className="related-courses-sidebar sticky-top p-lg-0 mt-lg-0"
                    style={{ top: "120px" }}
                  >
                    <h4 className="fs-3 fw-bold" style={{ color: "#e58a34" }}>
                      Other Courses
                    </h4>
                    {courseData.related_courses.map((course, i) => (
                      <Link
                        key={course.course_id || i}
                        href={getRelatedCourseHref(
                          course,
                          relatedCourseLinkVariant,
                          onlineCourseCity,
                        )}
                        className="text-decoration-none"
                      >
                        <div
                          className="card related-course-card"
                          style={{ marginTop: "10px" }}
                        >
                          <img
                            src={course.image || "/img/default-course.jpg"}
                            alt={course.name}
                            className="card-img-top"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                          <div className="card-body">
                            <h6
                              className="card-title mb-1 related-course-card-title text-center"
                              style={{
                                color: "#002341",
                                fontWeight: "600",
                                width: "100%",
                              }}
                            >
                              <span className="course-name">{course.name}</span>
                              <br />
                              <span className="course-full-form">
                                {course.full_form}
                              </span>
                            </h6>
                            <p className="card-text small">
                              {cleanQuestionText(
                                course.details || "",
                              ).substring(0, 100) +
                                (course.details && course.details.length > 100
                                  ? "..."
                                  : "")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CourseDetailPageWrapper(
  props: CourseDetailClientProps,
) {
  return (
    <Suspense
      fallback={
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }
    >
      <CourseDetailClient {...props} />
    </Suspense>
  );
}
