"use client";

import React from "react";
import Link from "next/link";
import type { TestResults } from "./FreeTest";

interface ScoreFeedback {
  title: string;
  message: string;
  badgeText: string;
  badgeBg: string;
}

interface FreeTestSidebarProps {
  courseCode: string;
  courseName?: string;
  activeCategoryName: string;
  testSubmitted: boolean;
  testResults: TestResults | null;
  feedback: ScoreFeedback | null;
  answeredCount: number;
  totalQuestions: number;
  progressPercentage: number;
}

interface PackagePromo {
  serviceType: "self-study" | "1-on-1-tutoring" | "group-tutoring";
  icon: string;
  title: string;
  tagline: string;
  buttonLabel: string;
}

const getPackagePromos = (courseName?: string): PackagePromo[] => [
  {
    serviceType: "self-study",
    icon: "bi-journal-bookmark-fill",
    title: "Subscription",
    tagline: `Study at your own pace with full ${courseName || "exam"} question banks and video explanations.`,
    buttonLabel: "View Plans",
  },
  {
    serviceType: "1-on-1-tutoring",
    icon: "bi-person-video3",
    title: "1-on-1 Tutoring",
    tagline: "Get a personalized study plan from an expert tutor focused on your weak areas.",
    buttonLabel: "View Packages",
  },
  {
    serviceType: "group-tutoring",
    icon: "bi-people-fill",
    title: "Group Tutoring",
    tagline: "Learn alongside peers with structured sessions and built-in accountability.",
    buttonLabel: "View Packages",
  },
];

function getRecommendedService(
  percentage: number | null,
): PackagePromo["serviceType"] {
  if (percentage === null) return "1-on-1-tutoring";
  if (percentage >= 80) return "self-study";
  if (percentage >= 60) return "group-tutoring";
  return "1-on-1-tutoring";
}

const FreeTestSidebar: React.FC<FreeTestSidebarProps> = ({
  courseCode,
  courseName,
  activeCategoryName,
  testSubmitted,
  testResults,
  feedback,
  answeredCount,
  totalQuestions,
  progressPercentage,
}) => {
  const packagePromos = getPackagePromos(courseName);
  const encodedCourseCode = encodeURIComponent(courseCode);
  const hasResults = testSubmitted && testResults && feedback;
  const recommendedService = getRecommendedService(
    hasResults ? testResults.percentage : null,
  );

  return (
    <div className="free-test-sidebar sticky-top" style={{ top: "120px" }}>
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
        {/* Results panel */}
        <div
          className="text-white text-center px-4 pt-4 pb-3"
          style={{ backgroundColor: "#002341" }}
        >
          {!hasResults ? (
            <>
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: "64px",
                  height: "64px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "2px dashed rgba(255,255,255,0.2)",
                }}
              >
                <i className="bi bi-clipboard-check fs-4 opacity-75"></i>
              </div>
              <h6 className="fw-bold mb-1">Your Score</h6>
              <p className="small opacity-75 mb-0 px-1">
                Submit the test to see your score and personalized feedback.
              </p>
            </>
          ) : (
            <>
              <span
                className="badge px-3 py-1 rounded-pill mb-2"
                style={{ backgroundColor: feedback.badgeBg, fontSize: "0.7rem" }}
              >
                {feedback.badgeText}
              </span>
              <h6 className="fw-bold mb-3">{feedback.title}</h6>
              <div className="d-inline-flex justify-content-center mb-2">
                <div
                  className="rounded-circle d-flex flex-column justify-content-center align-items-center"
                  style={{
                    width: "100px",
                    height: "100px",
                    border: `5px solid ${feedback.badgeBg}`,
                    backgroundColor: "#001d36",
                  }}
                >
                  <span className="fs-3 fw-bold lh-1">
                    {testResults.percentage}%
                  </span>
                  <span
                    className="small opacity-75"
                    style={{ fontSize: "0.65rem" }}
                  >
                    Correct
                  </span>
                </div>
              </div>
              <p className="small opacity-85 mb-3 px-1">{feedback.message}</p>
              <div className="d-flex rounded-3 overflow-hidden mx-auto" style={{ maxWidth: "220px" }}>
                <div
                  className="flex-fill py-2"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div className="fw-bold fs-5 lh-1">{testResults.score}</div>
                  <div className="small opacity-75" style={{ fontSize: "0.65rem" }}>
                    Correct
                  </div>
                </div>
                <div
                  className="flex-fill py-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="fw-bold fs-5 lh-1">
                    {testResults.totalQuestions - testResults.score}
                  </div>
                  <div className="small opacity-75" style={{ fontSize: "0.65rem" }}>
                    Incorrect
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section progress — always visible */}
          <div
            className="mt-3 pt-3 text-start"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="d-flex justify-content-between align-items-center small mb-1">
              <span className="opacity-75">{activeCategoryName}</span>
              {totalQuestions > 0 && (
                <span className="fw-semibold">
                  {answeredCount}/{totalQuestions}
                </span>
              )}
            </div>
            {totalQuestions > 0 && (
              <div
                className="progress"
                style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: "#e58a34",
                  }}
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}
          </div>
        </div>

        {/* Prep options — unified lower section */}
        <div className="bg-white px-4 py-3">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i
              className="bi bi-stars"
              style={{ color: "#e58a34", fontSize: "0.85rem" }}
            />
            <h6 className="fw-bold mb-0 small text-uppercase letter-spacing-1" style={{ color: "#002341", letterSpacing: "0.04em" }}>
              {hasResults ? "Recommended Next Steps" : "Explore Prep Options"}
            </h6>
          </div>
          <p className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>
            {hasResults
              ? "Based on your score, here are the best ways to keep improving."
              : "Choose the learning format that fits your schedule and goals."}
          </p>

          <div className="d-flex flex-column gap-2">
            {packagePromos.map((promo) => {
              const isRecommended = promo.serviceType === recommendedService;
              return (
                <Link
                  key={promo.serviceType}
                  href={`/package-details/${promo.serviceType}/${encodedCourseCode}`}
                  className="text-decoration-none d-block rounded-3 p-3 transition-all"
                  style={{
                    border: isRecommended
                      ? "1.5px solid #e58a34"
                      : "1px solid #e9ecef",
                    backgroundColor: isRecommended ? "#fffaf5" : "#fafbfc",
                  }}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: isRecommended ? "#e58a34" : "#eef2f6",
                        color: isRecommended ? "#fff" : "#002341",
                      }}
                    >
                      <i className={`bi ${promo.icon}`} style={{ fontSize: "0.9rem" }} />
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span
                          className="fw-semibold"
                          style={{ color: "#002341", fontSize: "0.85rem" }}
                        >
                          {promo.title}
                        </span>
                        {isRecommended && (
                          <span
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: "#e58a34",
                              fontSize: "0.6rem",
                              fontWeight: 600,
                            }}
                          >
                            Best Match
                          </span>
                        )}
                      </div>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.75rem", lineHeight: 1.45 }}
                      >
                        {promo.tagline}
                      </p>
                    </div>
                    <i
                      className="bi bi-chevron-right flex-shrink-0 opacity-50 mt-1"
                      style={{ fontSize: "0.75rem" }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {hasResults && (
            <Link
              href={`/package-details/${recommendedService}/${encodedCourseCode}`}
              className="btn w-100 fw-semibold text-white mt-3"
              style={{
                backgroundColor: "#e58a34",
                borderRadius: "10px",
                fontSize: "0.85rem",
                padding: "0.6rem",
              }}
            >
              Get Started with{" "}
              {packagePromos.find((p) => p.serviceType === recommendedService)
                ?.title ?? "Prep"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTestSidebar;
