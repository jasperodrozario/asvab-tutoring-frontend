"use client";

import React, { useState, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import { cleanQuestionText } from "@/utils/textUtils";
import { typesetMathJax, INACTIVE_CATEGORY_STYLE } from "@/utils/mathjax";
import FreeTestSidebar from "./FreeTestSidebar";

export interface Question {
  id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer: number;
}

export interface TestResult {
  question: string;
  options: string[];
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface TestResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  results: TestResult[];
}

export interface UserAnswers {
  [key: string]: number;
}

interface CategoryState {
  submitted: boolean;
  results: TestResults | null;
}

interface FreeTestProps {
  courseName?: string;
  courseCode: string;
  ft_cat_list?: string[];
  ft_ques_list?: { [key: string]: Question[] };
}

const FreeTest: React.FC<FreeTestProps> = ({
  courseName,
  courseCode,
  ft_cat_list,
  ft_ques_list,
}) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [categoryStates, setCategoryStates] = useState<
    Record<number, CategoryState>
  >({});
  const [mathJaxReady, setMathJaxReady] = useState(false);
  const mathContentRef = useRef<HTMLDivElement>(null);

  const runTypeset = useCallback(async () => {
    // Wait for React to commit question DOM before typesetting
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await typesetMathJax(mathContentRef.current);
    setMathJaxReady(true);
  }, []);

  // Typeset only when review panels mount/unmount (submit/retake) — not on category switch
  useLayoutEffect(() => {
    if (!mathJaxReady) return;
    void typesetMathJax(mathContentRef.current);
  }, [categoryStates, mathJaxReady]);

  // Fallback if MathJax loaded before the content ref was attached
  useLayoutEffect(() => {
    if (mathJaxReady || !mathContentRef.current) return;
    if (!window.MathJax?.Hub) return;
    void (async () => {
      await typesetMathJax(mathContentRef.current);
      setMathJaxReady(true);
    })();
  }, [mathJaxReady, ft_cat_list]);

  if (!ft_cat_list || !ft_ques_list || ft_cat_list.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-info">
          <h3>No Free Practice Test Available</h3>
          <p>
            We are currently updating the test questions for this course. Please
            check back later.
          </p>
          <Link
            href={`/courses/${encodeURIComponent(courseCode)}`}
            className="btn btn-primary-custom mt-3"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const activeCategoryName = ft_cat_list[activeCategory];
  const questions = ft_ques_list[activeCategoryName] || [];
  const { submitted: testSubmitted, results: testResults } =
    categoryStates[activeCategory] ?? { submitted: false, results: null };

  const handleAnswerChange = (
    categoryIndex: number,
    questionIndex: number,
    optionIndex: number,
  ): void => {
    setUserAnswers((prev) => ({
      ...prev,
      [`${categoryIndex}-${questionIndex}`]: optionIndex,
    }));
  };

  const submitTest = (): void => {
    let score = 0;

    const results: TestResult[] = questions.map((question, qIndex) => {
      const userAnswer = userAnswers[`${activeCategory}-${qIndex}`];
      const correctAnswer = question.answer - 1;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) score++;
      const options = [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d,
      ].filter((opt): opt is string => opt != null);
      return {
        question: question.question,
        options,
        userAnswer: userAnswer ?? null,
        correctAnswer,
        isCorrect,
      };
    });

    setCategoryStates((prev) => ({
      ...prev,
      [activeCategory]: {
        submitted: true,
        results: {
          score,
          totalQuestions: questions.length,
          percentage: Math.round((score / questions.length) * 100),
          results,
        },
      },
    }));
  };

  const retakeTest = (): void => {
    setCategoryStates((prev) => ({
      ...prev,
      [activeCategory]: { submitted: false, results: null },
    }));
    setUserAnswers((prev) => {
      const next = { ...prev };
      questions.forEach((_, qIndex) => {
        delete next[`${activeCategory}-${qIndex}`];
      });
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getAnsweredCount = (catIdx: number, catQuestions: Question[]) =>
    catQuestions.reduce(
      (count, _, qIndex) =>
        userAnswers[`${catIdx}-${qIndex}`] !== undefined ? count + 1 : count,
      0,
    );

  const totalQuestions = questions.length;
  const answeredCount = getAnsweredCount(activeCategory, questions);
  const progressPercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Feedback based on score
  const getScoreFeedback = (percentage: number) => {
    if (percentage >= 80) {
      return {
        title: "Excellent Work!",
        message:
          "You have a strong grasp of this topic. You are well on your way to success!",
        alertClass: "alert-success",
        badgeText: "High Pass",
        badgeBg: "#198754",
      };
    } else if (percentage >= 60) {
      return {
        title: "Good Effort, You Passed!",
        message:
          "You did well, but reviewing key concepts will help boost your score further.",
        alertClass: "alert-warning",
        badgeText: "Pass",
        badgeBg: "#fd7e14",
      };
    } else {
      return {
        title: "Practice Makes Perfect!",
        message:
          "Don't worry, military exams require targeted practice. We can help you master this section.",
        alertClass: "alert-danger",
        badgeText: "Practice Needed",
        badgeBg: "#dc3545",
      };
    }
  };

  const feedback = testResults
    ? getScoreFeedback(testResults.percentage)
    : null;

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/latest.js?config=TeX-MML-AM_CHTML"
        strategy="afterInteractive"
        onLoad={() => void runTypeset()}
      />
      <div className="container py-5">
        {/* Navigation Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <Link
              href={`/courses/${encodeURIComponent(courseCode)}`}
              className="text-decoration-none d-flex align-items-center text-secondary hover-primary"
            >
              <i className="bi bi-arrow-left me-2"></i> Back to{" "}
              {courseName || "Course"} Detail
            </Link>
          </div>
          <div>
            <span
              className="badge px-3 py-2 rounded-pill text-white"
              style={{ backgroundColor: "#002341" }}
            >
              Practice Test
            </span>
          </div>
        </div>

        {/* Main Title Banner */}
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-2" style={{ color: "#002341" }}>
            Free {courseName} Practice Test
          </h1>
          <p className="text-muted fs-5">
            Evaluate your knowledge and prepare for the actual exam in a
            focused, distraction-free environment.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            {/* Category Pills Navigation */}
            <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
              <div className="bg-light px-4 py-3 border-bottom">
                <h5 className="mb-0 fw-semibold text-secondary">
                  Select Category
                </h5>
              </div>
              <div className="card-body p-3">
                <ul className="nav nav-pills gap-2 justify-content-start">
                  {ft_cat_list.map((cat, idx) => (
                    <li key={idx} className="nav-item">
                      <button
                        className={`nav-link px-4 py-2 fw-medium transition-all ${
                          activeCategory === idx ? "active shadow-sm" : ""
                        }`}
                        onClick={() => setActiveCategory(idx)}
                        style={{
                          backgroundColor:
                            activeCategory === idx ? "#e58a34" : "#f8f9fa",
                          color: activeCategory === idx ? "#fff" : "#495057",
                          border: "1px solid",
                          borderColor:
                            activeCategory === idx ? "#e58a34" : "#e9ecef",
                          borderRadius: "20px",
                        }}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Test Questions Section — all categories stay mounted to avoid re-typesetting on switch */}
            <div
              ref={mathContentRef}
              className="position-relative"
              style={{
                visibility: mathJaxReady ? "visible" : "hidden",
                overflow: mathJaxReady ? undefined : "hidden",
              }}
            >
              {ft_cat_list.map((catName, catIdx) => {
                const catQuestions = ft_ques_list[catName] || [];
                const catState = categoryStates[catIdx] ?? {
                  submitted: false,
                  results: null,
                };
                const catSubmitted = catState.submitted;
                const catResults = catState.results;
                const catFeedback = catResults
                  ? getScoreFeedback(catResults.percentage)
                  : null;
                const isActive = catIdx === activeCategory;
                const catAnsweredCount = getAnsweredCount(catIdx, catQuestions);
                const catTotalQuestions = catQuestions.length;
                const catProgress =
                  catTotalQuestions > 0
                    ? Math.round(
                        (catAnsweredCount / catTotalQuestions) * 100,
                      )
                    : 0;

                return (
                  <div
                    key={catIdx}
                    className={!isActive && mathJaxReady ? "d-none" : undefined}
                    style={
                      !isActive && !mathJaxReady
                        ? INACTIVE_CATEGORY_STYLE
                        : undefined
                    }
                    aria-hidden={!isActive}
                  >
                    {/* Questions stay mounted (hidden when submitted) so MathJax isn't re-run on retake */}
                    <div className={catSubmitted ? "d-none" : undefined}>
                      {catQuestions.length > 0 ? (
                        <>
                          <div className="card shadow-sm border-0 mb-4 p-4 rounded-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-semibold text-secondary">
                                  Category:{" "}
                                  <span style={{ color: "#002341" }}>
                                    {catName}
                                  </span>
                                </span>
                                <span
                                  className="fw-semibold"
                                  style={{ color: "#e58a34" }}
                                >
                                  {catAnsweredCount} of {catTotalQuestions}{" "}
                                  Questions Answered
                                </span>
                              </div>
                              <div
                                className="progress"
                                style={{ height: "10px", borderRadius: "5px" }}
                              >
                                <div
                                  className="progress-bar progress-bar-striped progress-bar-animated"
                                  role="progressbar"
                                  style={{
                                    width: `${catProgress}%`,
                                    backgroundColor: "#e58a34",
                                  }}
                                  aria-valuenow={catProgress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                            </div>

                            {catQuestions.map((q, qIdx) => {
                              const options = [
                                q.option_a,
                                q.option_b,
                                q.option_c,
                                q.option_d,
                              ].filter((opt): opt is string => opt != null);

                              const isAnswered =
                                userAnswers[`${catIdx}-${qIdx}`] !== undefined;

                              return (
                                <div
                                  key={q.id || qIdx}
                                  className="card mb-4 border-0 shadow-sm rounded-3 overflow-hidden transition-all"
                                  style={{
                                    borderLeft: isAnswered
                                      ? "5px solid #e58a34"
                                      : "5px solid #dee2e6",
                                  }}
                                >
                                  <div className="card-body p-4">
                                    <div className="d-flex align-items-start mb-3">
                                      <span
                                        className="badge me-3 px-3 py-2 rounded-3 text-white"
                                        style={{
                                          backgroundColor: isAnswered
                                            ? "#e58a34"
                                            : "#6c757d",
                                        }}
                                      >
                                        Q {qIdx + 1}
                                      </span>
                                      <h5 className="fw-bold mb-0 lh-base text-dark pt-1">
                                        {cleanQuestionText(q.question, true)}
                                      </h5>
                                    </div>

                                    <div className="options-container mt-4 ps-lg-5">
                                      <div className="row g-3">
                                        {options.map((opt, oIdx) => {
                                          const isSelected =
                                            userAnswers[
                                              `${catIdx}-${qIdx}`
                                            ] === oIdx;
                                          return (
                                            <div key={oIdx} className="col-12">
                                              <label
                                                htmlFor={`q-${catIdx}-${qIdx}-o-${oIdx}`}
                                                className="d-flex align-items-center p-3 rounded-3 border cursor-pointer w-100 mb-0"
                                                style={{
                                                  borderColor: isSelected
                                                    ? "#e58a34"
                                                    : "#dee2e6",
                                                  backgroundColor: isSelected
                                                    ? "#fffaf5"
                                                    : "#fff",
                                                  cursor: "pointer",
                                                  boxShadow: isSelected
                                                    ? "0 2px 4px rgba(229,138,52,0.1)"
                                                    : "none",
                                                }}
                                              >
                                                <input
                                                  className="visually-hidden"
                                                  type="radio"
                                                  name={`q-${catIdx}-${qIdx}`}
                                                  id={`q-${catIdx}-${qIdx}-o-${oIdx}`}
                                                  checked={isSelected}
                                                  onChange={() =>
                                                    handleAnswerChange(
                                                      catIdx,
                                                      qIdx,
                                                      oIdx,
                                                    )
                                                  }
                                                />
                                                <span
                                                  className="flex-shrink-0"
                                                  aria-hidden="true"
                                                  style={{
                                                    width: "1.25rem",
                                                    height: "1.25rem",
                                                    borderRadius: "50%",
                                                    border: `2px solid ${isSelected ? "#e58a34" : "#adb5bd"}`,
                                                    backgroundColor: isSelected
                                                      ? "#e58a34"
                                                      : "#fff",
                                                    boxShadow: isSelected
                                                      ? "0 0 0 3px rgba(229, 138, 52, 0.2)"
                                                      : "none",
                                                  }}
                                                />
                                                <span className="ms-3 text-dark fw-medium">
                                                  {cleanQuestionText(opt, true)}
                                                </span>
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="text-center my-5 d-flex justify-content-center align-items-center gap-3">
                              <button
                                onClick={submitTest}
                                className="btn btn-lg px-5 py-3 fw-bold text-white shadow-sm"
                                style={{
                                  backgroundColor: "#e58a34",
                                  borderColor: "#e58a34",
                                  borderRadius: "30px",
                                }}
                                disabled={catAnsweredCount === 0}
                              >
                                Submit Practice Test
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="card shadow-sm border-0 p-5 text-center rounded-3">
                            <div className="text-muted mb-3">
                              <i className="bi bi-journal-x fs-1"></i>
                            </div>
                            <h4 className="fw-bold">No Questions Found</h4>
                            <p className="text-muted">
                              There are no practice questions loaded in this
                              category yet.
                            </p>
                          </div>
                        )}
                    </div>

                    {catResults && catFeedback && (
                      <div
                        className={
                          catSubmitted ? "results-container animate-fade-in" : "d-none"
                        }
                      >
                          <h3
                            className="fw-bold mb-4 text-dark"
                            id="review-section"
                          >
                            Question Review
                          </h3>
                          {catResults.results.map((res, i) => (
                            <div
                              key={i}
                              className="card mb-4 border-0 shadow-sm rounded-3 overflow-hidden"
                              style={{
                                borderLeft: res.isCorrect
                                  ? "5px solid #198754"
                                  : "5px solid #dc3545",
                              }}
                            >
                              <div
                                className="px-4 py-3 d-flex justify-content-between align-items-center"
                                style={{
                                  backgroundColor: res.isCorrect
                                    ? "#f4fcf7"
                                    : "#fff5f5",
                                }}
                              >
                                <span className="fw-bold">Question {i + 1}</span>
                                <span
                                  className={`badge px-3 py-2 rounded-pill fw-semibold ${
                                    res.isCorrect
                                      ? "bg-success text-white"
                                      : "bg-danger text-white"
                                  }`}
                                >
                                  {res.isCorrect ? (
                                    <span>
                                      <i className="bi bi-check-circle me-1"></i>{" "}
                                      Correct
                                    </span>
                                  ) : (
                                    <span>
                                      <i className="bi bi-x-circle me-1"></i>{" "}
                                      Incorrect
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="card-body p-4">
                                <h5 className="fw-semibold text-dark mb-4">
                                  {cleanQuestionText(res.question, true)}
                                </h5>
                                <div className="row g-2">
                                  {res.options.map((opt, oIdx) => {
                                    let cardBg = "#fff";
                                    let borderCol = "#dee2e6";
                                    let textCol = "text-dark";
                                    let icon = null;

                                    if (oIdx === res.correctAnswer) {
                                      cardBg = "#e8f5e9";
                                      borderCol = "#2e7d32";
                                      textCol = "text-success fw-bold";
                                      icon = (
                                        <i className="bi bi-check-circle-fill me-2 text-success"></i>
                                      );
                                    } else if (
                                      res.userAnswer !== null &&
                                      oIdx === res.userAnswer &&
                                      !res.isCorrect
                                    ) {
                                      cardBg = "#ffebee";
                                      borderCol = "#c62828";
                                      textCol = "text-danger fw-bold";
                                      icon = (
                                        <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                                      );
                                    }

                                    return (
                                      <div key={oIdx} className="col-12">
                                        <div
                                          className="d-flex align-items-center p-3 rounded-3 border"
                                          style={{
                                            backgroundColor: cardBg,
                                            borderColor: borderCol,
                                          }}
                                        >
                                          <span className={`flex-grow-1 ${textCol}`}>
                                            <span className="me-2 text-muted">
                                              {String.fromCharCode(65 + oIdx)}.
                                            </span>
                                            {cleanQuestionText(opt, true)}
                                          </span>
                                          {icon}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="text-center my-5 d-flex justify-content-center align-items-center gap-3 flex-wrap">
                            <button
                              onClick={retakeTest}
                              className="btn btn-outline-secondary px-4 py-3 fw-bold"
                              style={{ borderRadius: "30px" }}
                            >
                              <i className="bi bi-arrow-clockwise me-2"></i>{" "}
                              Retake This Test
                            </button>

                            <Link
                              href={`/courses/${encodeURIComponent(courseCode)}`}
                              className="btn px-4 py-3 fw-bold text-white shadow-sm"
                              style={{
                                backgroundColor: "#002341",
                                borderColor: "#002341",
                                borderRadius: "30px",
                              }}
                            >
                              Back to Course Overview
                            </Link>

                            <button
                              onClick={() => {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              className="btn btn-light px-4 py-3 fw-semibold border"
                              style={{ borderRadius: "30px" }}
                              title="Go to Top"
                            >
                              <i className="bi bi-arrow-up me-1"></i> Top
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-lg-4 align-self-start">
            <FreeTestSidebar
              courseCode={courseCode}
              courseName={courseName}
              activeCategoryName={activeCategoryName}
              testSubmitted={testSubmitted}
              testResults={testResults}
              feedback={feedback}
              answeredCount={answeredCount}
              totalQuestions={totalQuestions}
              progressPercentage={progressPercentage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FreeTest;
