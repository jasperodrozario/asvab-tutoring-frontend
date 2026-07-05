"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import LessonPlanTab from "@/components/tabs/LessonPlanTab";
import FreeLessonVideosTab, { VideoObject } from "@/components/tabs/FreeLessonVideosTab";
import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import CourseOverviewVideoEmbed from "@/components/course/CourseOverviewVideoEmbed";
import PredictionTestLinkButton from "@/components/prediction-test/PredictionTestLinkButton";
import { getCourseFreePredictionTestHref } from "@/lib/prediction-test-links";
import { processHtmlContent } from "@/lib/decode-html";
import type { CourseData } from "@/lib/course-types";
import type { CourseOverviewVideo } from "@/lib/php-api";
import type { PackagesByService } from "@/lib/package-types";
import styles from "./courseDetail.module.css";

export type CourseDetailClientProps = {
  courseCode: string;
  courseData: CourseData | null;
  courseOverviewVideoData?: CourseOverviewVideo | null;
  packagesByService?: PackagesByService;
  location?: string;
  breadcrumbSegments: string[];
  hasFreePredTest?: boolean;
  hasFreePracticeTest?: boolean;
};

function formatLocationLabel(location: string): string {
  return location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CourseDetailClient({
  courseCode,
  courseData,
  packagesByService,
  location: locationProp = "",
  breadcrumbSegments,
  courseOverviewVideoData,
  hasFreePredTest = false,
  hasFreePracticeTest = false,
}: CourseDetailClientProps) {
  const searchParams = useSearchParams();
  const location = locationProp || searchParams?.get("location") || "";

  const [activeTab, setActiveTab] = useState<number>(0);

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

  const hasSessions = (courseData.sessions?.length ?? 0) > 0;

  const showFreeTestLink = hasFreePracticeTest;

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
              {courseOverviewVideoData ? (
                <CourseOverviewVideoEmbed
                  video={courseOverviewVideoData}
                  fallbackImageSrc={courseData.image_src}
                  fallbackImageAlt={courseData.course_name || "Course Image"}
                />
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
                  {hasSessions && (
                    <li className="nav-item">
                      <button
                        className={`nav-link tab-btn ${activeTab === 4 ? "active" : ""}`}
                        onClick={() => setActiveTab(4)}
                      >
                        Session Plan
                      </button>
                    </li>
                  )}
                  {hasVideo && (
                    <li className="nav-item">
                      <button
                        className={`nav-link tab-btn ${activeTab === 2 ? "active" : ""}`}
                        onClick={() => setActiveTab(2)}
                      >
                        Free Lesson Videos
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
                      {(showFreeTestLink || hasFreePredTest) && (
                        <div className={styles.overviewTestActions}>
                          {showFreeTestLink ? (
                            <Link
                              href={`/courses/${encodeURIComponent(courseCode)}/free-practice-test`}
                              className={`btn btn-primary-custom d-inline-flex align-items-center gap-2 ${styles.overviewTestBtn}`}
                            >
                              <i className="bi bi-clipboard-check" aria-hidden />
                              Take a Free Practice Test
                            </Link>
                          ) : null}
                          {hasFreePredTest ? (
                            <PredictionTestLinkButton
                              href={getCourseFreePredictionTestHref(courseCode)}
                              className={styles.overviewTestBtn}
                            >
                              Take a Free Prediction Test
                            </PredictionTestLinkButton>
                          ) : null}
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
                  {hasSessions && activeTab === 4 && (
                    <div className="sessions-tab transition-fade">
                      <LessonPlanTab sessions={courseData.sessions} />
                    </div>
                  )}
                  {activeTab === 2 && (
                    <FreeLessonVideosTab video={courseData.video} />
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4 align-self-start">
              {packagesByService && (
                <CoursePricingPanel
                  courseCode={courseCode}
                  packagesByService={packagesByService}
                />
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
