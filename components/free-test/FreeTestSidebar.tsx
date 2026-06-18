"use client";

import React from "react";
import type { TestResults } from "./FreeTest";

interface ScoreFeedback {
  title: string;
  message: string;
  badgeText: string;
  badgeBg: string;
}

interface FreeTestSidebarProps {
  activeCategoryName: string;
  testSubmitted: boolean;
  testResults: TestResults | null;
  feedback: ScoreFeedback | null;
  answeredCount: number;
  totalQuestions: number;
  progressPercentage: number;
}

const FreeTestSidebar: React.FC<FreeTestSidebarProps> = ({
  activeCategoryName,
  testSubmitted,
  testResults,
  feedback,
  answeredCount,
  totalQuestions,
  progressPercentage,
}) => {
  const hasResults = testSubmitted && testResults && feedback;

  return (
    <div className="free-test-sidebar">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
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
      </div>
    </div>
  );
};

export default FreeTestSidebar;
