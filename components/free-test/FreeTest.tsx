"use client";

import React, { useState, useLayoutEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import CoursePricingPanel from "@/components/pricing/CoursePricingPanel";
import prepStyles from "@/components/pricing/coursePricing.module.css";
import freeTestStyles from "./freeTest.module.css";
import {
  typesetMathJax,
  ACTIVE_CATEGORY_STYLE,
  INACTIVE_CATEGORY_STYLE,
} from "@/utils/mathjax";
import QuestionHtml from "./QuestionHtml";
import type { PackagesByService } from "@/lib/package-types";
import type { FreePracticeTestQuestion } from "@/lib/course-types";
import { prepareFreeTestQuestions, getQuestionOptions } from "@/lib/course-types";
import FreeTestSidebar from "./FreeTestSidebar";

const BREADCRUMB_SEGMENTS = (courseCode: string) =>
  ["courses", courseCode, "free-practice-test"] as const;

const BREADCRUMB_TITLE = "Free Practice Test";

function ShowAllFreeTestsLink() {
  return (
    <div className={`container ${freeTestStyles.showAllTestsWrap}`}>
      <Link
        href="/free-practice-tests"
        className={`btn btn-secondary-custom px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 ${freeTestStyles.showAllTestsBtn}`}
      >
        <i className="bi bi-clipboard-check" aria-hidden />
        Show all Free Tests
      </Link>
    </div>
  );
}

export type Question = FreePracticeTestQuestion;

function shouldShowStoryPassage(
  question: FreePracticeTestQuestion,
  previousQuestion?: FreePracticeTestQuestion,
): boolean {
  if (!question.story?.trim() || !question.story_id) {
    return false;
  }

  return String(question.story_id) !== String(previousQuestion?.story_id ?? "");
}

function shouldShowStoryPassageForResult(
  result: TestResult,
  previousResult?: TestResult,
): boolean {
  if (!result.story?.trim() || !result.story_id) {
    return false;
  }

  return String(result.story_id) !== String(previousResult?.story_id ?? "");
}

function StoryPassage({
  story,
  storyTitle,
}: {
  story: string;
  storyTitle?: string | null;
}) {
  return (
    <div
      className={`mb-4 p-3 rounded-3 border bg-light ${freeTestStyles.storyPassage}`}
    >
      {storyTitle?.trim() ? (
        <h6 className="fw-semibold mb-2 text-secondary">{storyTitle}</h6>
      ) : null}
      <QuestionHtml html={story} />
    </div>
  );
}

export interface TestResult {
  question: string;
  story?: string | null;
  story_title?: string | null;
  story_id?: string | number | null;
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
  packagesByService?: PackagesByService;
}

const FreeTest: React.FC<FreeTestProps> = ({
  courseName,
  courseCode,
  ft_cat_list,
  ft_ques_list,
  packagesByService,
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

  // Re-typeset when review panels or active category change (visibility hide keeps DOM intact; this covers edge cases)
  useLayoutEffect(() => {
    if (!mathJaxReady) return;
    void typesetMathJax(mathContentRef.current);
  }, [categoryStates, activeCategory, mathJaxReady]);

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
      <>
        <div className="page-title-area text-white py-5">
          <div className="container text-center">
            <h1>
              FREE {courseName?.toUpperCase() || "COURSE"} PRACTICE TEST
            </h1>
            <h2 className="h4">
              EVALUATE YOUR KNOWLEDGE AND PREPARE FOR TEST DAY
            </h2>
            <Breadcrumb
              segments={[...BREADCRUMB_SEGMENTS(courseCode)]}
              segmentLabels={{ 1: courseName || courseCode.toUpperCase() }}
              dynamicTitle={BREADCRUMB_TITLE}
            />
          </div>
        </div>
        <ShowAllFreeTestsLink />
        <div className="container pb-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
                <div className="alert alert-info">
                  <h3>No Free Practice Test Available</h3>
                  <p>
                    We are currently updating the test questions for this
                    course. Please check back later.
                  </p>
                  <Link
                    href={`/courses/${encodeURIComponent(courseCode)}`}
                    className="btn btn-primary-custom mt-3"
                  >
                    Back to Course
                  </Link>
                </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { sufficient: hasSufficientQuestions, questionsByCategory } =
    prepareFreeTestQuestions(ft_cat_list, ft_ques_list);

  if (!hasSufficientQuestions) {
    return (
      <>
        <div className="page-title-area text-white py-5">
          <div className="container text-center">
            <h1>
              FREE {courseName?.toUpperCase() || "COURSE"} PRACTICE TEST
            </h1>
            <h2 className="h4">
              EVALUATE YOUR KNOWLEDGE AND PREPARE FOR TEST DAY
            </h2>
            <Breadcrumb
              segments={[...BREADCRUMB_SEGMENTS(courseCode)]}
              segmentLabels={{ 1: courseName || courseCode.toUpperCase() }}
              dynamicTitle={BREADCRUMB_TITLE}
            />
          </div>
        </div>
        <ShowAllFreeTestsLink />
        <div className="container pb-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
                <div className="alert alert-info">
                  <h3>No Free Practice Test Available</h3>
                  <p>
                    Sorry, currently there are no free tests available for this
                    course. Check back again later.
                  </p>
                  <Link
                    href={`/courses/${encodeURIComponent(courseCode)}`}
                    className="btn btn-primary-custom mt-3"
                  >
                    Back to Course
                  </Link>
                </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const activeCategoryName = ft_cat_list[activeCategory];
  const questions = questionsByCategory[activeCategoryName] || [];
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
      const correctAnswer = Number(question.answer) - 1;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) score++;
      const options = getQuestionOptions(question);
      return {
        question: question.question,
        story: question.story,
        story_title: question.story_title,
        story_id: question.story_id,
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

  const hasSubmittedResults = testSubmitted && testResults && feedback;
  const prepIntroTitle = hasSubmittedResults
    ? "Recommended Next Steps"
    : "Explore Prep Options";
  const prepIntroText = hasSubmittedResults
    ? `${feedback.message} Our ${courseName || "exam"} courses are designed to turn practice into progress—choose a plan below and let our instructors help you close the gaps before test day.`
    : `Your practice test is a starting point. Our ${courseName || "exam"} courses build on it with structured lessons, expert guidance, and proven strategies to help you raise your score and walk in prepared on test day.`;

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/latest.js?config=TeX-MML-AM_CHTML"
        strategy="afterInteractive"
        onLoad={() => void runTypeset()}
      />
      <div className="page-title-area text-white py-5">
        <div className="container text-center">
          <h1>FREE {courseName?.toUpperCase() || "COURSE"} PRACTICE TEST</h1>
          <h2 className="h4">
            EVALUATE YOUR KNOWLEDGE IN A FOCUSED, DISTRACTION-FREE ENVIRONMENT
          </h2>
          <Breadcrumb
            segments={[...BREADCRUMB_SEGMENTS(courseCode)]}
            segmentLabels={{ 1: courseName || courseCode.toUpperCase() }}
            dynamicTitle={BREADCRUMB_TITLE}
          />
        </div>
      </div>

      <ShowAllFreeTestsLink />

      <div className="container">
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
              className={`${freeTestStyles.categoryPanels} ${
                mathJaxReady ? "" : freeTestStyles.categoryPanelsLoading
              }`}
            >
              {ft_cat_list.map((catName, catIdx) => {
                const catQuestions = questionsByCategory[catName] || [];
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
                    style={
                      isActive ? ACTIVE_CATEGORY_STYLE : INACTIVE_CATEGORY_STYLE
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
                              const options = getQuestionOptions(q);

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
                                    {shouldShowStoryPassage(q, catQuestions[qIdx - 1]) &&
                                    q.story ? (
                                      <StoryPassage
                                        story={q.story}
                                        storyTitle={q.story_title}
                                      />
                                    ) : null}

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
                                      <div className="fw-bold mb-0 lh-base text-dark pt-1 flex-grow-1">
                                        <QuestionHtml html={q.question} />
                                      </div>
                                    </div>

                                    <div className="options-container mt-4 ps-lg-5">
                                      <div className="row g-2">
                                        {options.map((opt, oIdx) => {
                                          const isSelected =
                                            userAnswers[
                                              `${catIdx}-${qIdx}`
                                            ] === oIdx;
                                          return (
                                            <div key={oIdx} className="col-12">
                                              <label
                                                htmlFor={`q-${catIdx}-${qIdx}-o-${oIdx}`}
                                                className={`d-flex align-items-center p-3 rounded-3 border cursor-pointer w-100 mb-0 ${freeTestStyles.optionLabel} ${
                                                  isSelected
                                                    ? freeTestStyles.optionLabelSelected
                                                    : ""
                                                }`}
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
                                                  className={`flex-shrink-0 ${freeTestStyles.optionRadio} ${
                                                    isSelected
                                                      ? freeTestStyles.optionRadioSelected
                                                      : ""
                                                  }`}
                                                  aria-hidden="true"
                                                />
                                                <span className="ms-3 text-dark fw-medium flex-grow-1">
                                                  <QuestionHtml html={opt} />
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
                                {shouldShowStoryPassageForResult(
                                  res,
                                  i > 0 ? catResults.results[i - 1] : undefined,
                                ) && res.story ? (
                                  <StoryPassage
                                    story={res.story}
                                    storyTitle={res.story_title}
                                  />
                                ) : null}

                                <div className="fw-semibold text-dark mb-4">
                                  <QuestionHtml html={res.question} />
                                </div>
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
                                            <QuestionHtml html={opt} />
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
              activeCategoryName={activeCategoryName}
              testSubmitted={testSubmitted}
              testResults={testResults}
              feedback={feedback}
              answeredCount={answeredCount}
              totalQuestions={totalQuestions}
              progressPercentage={progressPercentage}
            />
            {packagesByService && (
              <div className={`mt-4 ${prepStyles.prepStack}`}>
                <div className={prepStyles.prepIntro}>
                  <div className={prepStyles.prepIntroHeader}>
                    <i className={`bi bi-stars ${prepStyles.prepIntroIcon}`} />
                    <h2 className={prepStyles.prepIntroTitle}>
                      {prepIntroTitle}
                    </h2>
                  </div>
                  <p className={prepStyles.prepIntroText}>{prepIntroText}</p>
                  <ul className={prepStyles.prepIntroBenefits}>
                    <li>
                      <i className="bi bi-check-circle-fill" />
                      Expert-led instruction
                    </li>
                    <li>
                      <i className="bi bi-check-circle-fill" />
                      Flexible learning formats
                    </li>
                    <li>
                      <i className="bi bi-check-circle-fill" />
                      Proven score improvement
                    </li>
                  </ul>
                </div>
                <CoursePricingPanel
                  courseCode={courseCode}
                  packagesByService={packagesByService}
                  embedded
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FreeTest;
