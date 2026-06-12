"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { cleanQuestionText } from '@/utils/textUtils';

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
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

  if (!ft_cat_list || !ft_ques_list || ft_cat_list.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-info">
          <h3>No Free Practice Test Available</h3>
          <p>We are currently updating the test questions for this course. Please check back later.</p>
          <Link href={`/courses/${encodeURIComponent(courseCode)}`} className="btn btn-primary-custom mt-3">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const activeCategoryName = ft_cat_list[activeCategory];
  const questions = ft_ques_list[activeCategoryName] || [];

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

    setTestResults({
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results,
    });
    setTestSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retakeTest = (): void => {
    setTestSubmitted(false);
    setTestResults(null);
    setUserAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate progress stats
  const totalQuestions = questions.length;
  const answeredCount = questions.reduce((count, _, qIndex) => {
    return userAnswers[`${activeCategory}-${qIndex}`] !== undefined ? count + 1 : count;
  }, 0);
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Feedback based on score
  const getScoreFeedback = (percentage: number) => {
    if (percentage >= 80) {
      return {
        title: "Excellent Work!",
        message: "You have a strong grasp of this topic. You are well on your way to success!",
        alertClass: "alert-success",
        badgeText: "High Pass",
        badgeBg: "#198754",
      };
    } else if (percentage >= 60) {
      return {
        title: "Good Effort, You Passed!",
        message: "You did well, but reviewing key concepts will help boost your score further.",
        alertClass: "alert-warning",
        badgeText: "Pass",
        badgeBg: "#fd7e14",
      };
    } else {
      return {
        title: "Practice Makes Perfect!",
        message: "Don't worry, military exams require targeted practice. We can help you master this section.",
        alertClass: "alert-danger",
        badgeText: "Practice Needed",
        badgeBg: "#dc3545",
      };
    }
  };

  const feedback = testResults ? getScoreFeedback(testResults.percentage) : null;

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      {/* Navigation Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <Link href={`/courses/${encodeURIComponent(courseCode)}`} className="text-decoration-none d-flex align-items-center text-secondary hover-primary">
            <i className="bi bi-arrow-left me-2"></i> Back to {courseName || "Course"} Detail
          </Link>
        </div>
        <div>
          <span className="badge px-3 py-2 rounded-pill text-white" style={{ backgroundColor: "#002341" }}>
            Practice Test
          </span>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-9">
          {/* Main Title Banner */}
          <div className="text-center mb-5">
            <h1 className="fw-bold mb-2" style={{ color: "#002341" }}>
              Free {courseName} Practice Test
            </h1>
            <p className="text-muted fs-5">
              Evaluate your knowledge and prepare for the actual exam in a focused, distraction-free environment.
            </p>
          </div>

          {/* Category Pills Navigation */}
          <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
            <div className="bg-light px-4 py-3 border-bottom">
              <h5 className="mb-0 fw-semibold text-secondary">Select Category</h5>
            </div>
            <div className="card-body p-3">
              <ul className="nav nav-pills gap-2 justify-content-center justify-content-lg-start">
                {ft_cat_list.map((cat, idx) => (
                  <li key={idx} className="nav-item">
                    <button
                      className={`nav-link px-4 py-2 fw-medium transition-all ${
                        activeCategory === idx ? "active shadow-sm" : ""
                      }`}
                      onClick={() => {
                        setActiveCategory(idx);
                        setTestSubmitted(false);
                        setTestResults(null);
                        setUserAnswers({});
                      }}
                      style={{
                        backgroundColor: activeCategory === idx ? "#e58a34" : "#f8f9fa",
                        color: activeCategory === idx ? "#white" : "#495057",
                        border: "1px solid",
                        borderColor: activeCategory === idx ? "#e58a34" : "#e9ecef",
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

          {/* Test Questions Section */}
          {!testSubmitted ? (
            <>
              {questions.length > 0 ? (
                <>
                  {/* Real-time Progress Bar */}
                  <div className="card shadow-sm border-0 mb-4 p-4 rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold text-secondary">
                        Category: <span style={{ color: "#002341" }}>{activeCategoryName}</span>
                      </span>
                      <span className="fw-semibold" style={{ color: "#e58a34" }}>
                        {answeredCount} of {totalQuestions} Questions Answered
                      </span>
                    </div>
                    <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: "#e58a34",
                        }}
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>

                  {/* Questions List */}
                  {questions.map((q, qIdx) => {
                    const options = [
                      q.option_a,
                      q.option_b,
                      q.option_c,
                      q.option_d,
                    ].filter((opt): opt is string => opt != null);
                    
                    const isAnswered = userAnswers[`${activeCategory}-${qIdx}`] !== undefined;

                    return (
                      <div
                        key={q.id || qIdx}
                        className="card mb-4 border-0 shadow-sm rounded-3 overflow-hidden transition-all"
                        style={{
                          borderLeft: isAnswered ? "5px solid #e58a34" : "5px solid #dee2e6",
                        }}
                      >
                        <div className="card-body p-4">
                          <div className="d-flex align-items-start mb-3">
                            <span
                              className="badge me-3 px-3 py-2 rounded-3 text-white"
                              style={{
                                backgroundColor: isAnswered ? "#e58a34" : "#6c757d",
                              }}
                            >
                              Q {qIdx + 1}
                            </span>
                            <h5 className="fw-bold mb-0 lh-base text-dark pt-1">
                              {cleanQuestionText(q.question)}
                            </h5>
                          </div>

                          <div className="options-container mt-4 ps-lg-5">
                            <div className="row g-3">
                              {options.map((opt, oIdx) => {
                                const isSelected = userAnswers[`${activeCategory}-${qIdx}`] === oIdx;
                                return (
                                  <div key={oIdx} className="col-12">
                                    <label
                                      className="d-flex align-items-center p-3 rounded-3 border transition-all cursor-pointer w-100 mb-0"
                                      style={{
                                        borderColor: isSelected ? "#e58a34" : "#dee2e6",
                                        backgroundColor: isSelected ? "#fffaf5" : "#white",
                                        cursor: "pointer",
                                        boxShadow: isSelected ? "0 2px 4px rgba(229,138,52,0.1)" : "none",
                                      }}
                                    >
                                      <input
                                        className="form-check-input flex-shrink-0"
                                        type="radio"
                                        name={`q-${activeCategory}-${qIdx}`}
                                        id={`q-${activeCategory}-${qIdx}-o-${oIdx}`}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(activeCategory, qIdx, oIdx)}
                                        style={{
                                          width: "1.25rem",
                                          height: "1.25rem",
                                          borderColor: isSelected ? "#e58a34" : "#adb5bd",
                                          accentColor: "#e58a34",
                                          cursor: "pointer",
                                        }}
                                      />
                                      <span className="ms-3 text-dark fw-medium">
                                        {cleanQuestionText(opt)}
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

                  {/* Actions Bar */}
                  <div className="text-center my-5 d-flex justify-content-center align-items-center gap-3">
                    <button
                      onClick={submitTest}
                      className="btn btn-lg px-5 py-3 fw-bold text-white shadow-sm"
                      style={{
                        backgroundColor: "#e58a34",
                        borderColor: "#e58a34",
                        borderRadius: "30px",
                      }}
                      disabled={answeredCount === 0}
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
                  <p className="text-muted">There are no practice questions loaded in this category yet.</p>
                </div>
              )}
            </>
          ) : (
            testResults && feedback && (
              <div className="results-container animate-fade-in">
                {/* Result Card */}
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-5">
                  <div className="card-body p-5 text-center text-white" style={{ backgroundColor: "#002341" }}>
                    <span className="badge px-3 py-2 rounded-pill mb-3" style={{ backgroundColor: feedback.badgeBg }}>
                      {feedback.badgeText}
                    </span>
                    <h2 className="fw-bold mb-4">{feedback.title}</h2>
                    
                    {/* Score Ring Display */}
                    <div className="d-inline-flex justify-content-center align-items-center mb-4 position-relative">
                      <div
                        className="rounded-circle d-flex flex-column justify-content-center align-items-center shadow-lg"
                        style={{
                          width: "160px",
                          height: "160px",
                          border: `8px solid ${feedback.badgeBg}`,
                          backgroundColor: "#001d36",
                        }}
                      >
                        <span className="fs-1 fw-bold">{testResults.percentage}%</span>
                        <span className="small text-muted">Correct</span>
                      </div>
                    </div>

                    <p className="fs-5 max-w-2xl mx-auto opacity-90 mb-0">
                      {feedback.message}
                    </p>
                    <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-center gap-4">
                      <div>
                        <h4 className="fw-bold mb-0">{testResults.score}</h4>
                        <span className="small text-muted">Correct Answers</span>
                      </div>
                      <div className="border-start border-secondary border-opacity-25 ps-4">
                        <h4 className="fw-bold mb-0">{testResults.totalQuestions - testResults.score}</h4>
                        <span className="small text-muted">Incorrect Answers</span>
                      </div>
                    </div>
                  </div>

                  {/* Enroll CTA Banner */}
                  <div className="p-4 text-center bg-light border-bottom d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 px-5">
                    <div className="text-start">
                      <h5 className="fw-bold text-dark mb-1">Want to secure a perfect score?</h5>
                      <p className="text-muted mb-0 small">Get full access to all questions, answers, video explanations & 1-on-1 expert support.</p>
                    </div>
                    <Link
                      href={`/package-details/1-on-1-tutoring/${encodeURIComponent(courseCode)}`}
                      className="btn px-4 py-2 fw-semibold text-white shadow-sm"
                      style={{ backgroundColor: "#e58a34", borderRadius: "8px" }}
                    >
                      Unlock Full Prep Package
                    </Link>
                  </div>
                </div>

                {/* Question Breakdown Review */}
                <h3 className="fw-bold mb-4 text-dark" id="review-section">Question Review</h3>
                {testResults.results.map((res, i) => (
                  <div
                    key={i}
                    className="card mb-4 border-0 shadow-sm rounded-3 overflow-hidden"
                    style={{
                      borderLeft: res.isCorrect ? "5px solid #198754" : "5px solid #dc3545",
                    }}
                  >
                    <div
                      className="px-4 py-3 d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: res.isCorrect ? "#f4fcf7" : "#fff5f5",
                      }}
                    >
                      <span className="fw-bold">Question {i + 1}</span>
                      <span
                        className={`badge px-3 py-2 rounded-pill fw-semibold ${
                          res.isCorrect ? "bg-success text-white" : "bg-danger text-white"
                        }`}
                      >
                        {res.isCorrect ? (
                          <span><i className="bi bi-check-circle me-1"></i> Correct</span>
                        ) : (
                          <span><i className="bi bi-x-circle me-1"></i> Incorrect</span>
                        )}
                      </span>
                    </div>

                    <div className="card-body p-4">
                      <h5 className="fw-semibold text-dark mb-4">{cleanQuestionText(res.question)}</h5>
                      <div className="row g-2">
                        {res.options.map((opt, oIdx) => {
                          let cardBg = "#white";
                          let borderCol = "#dee2e6";
                          let textCol = "text-dark";
                          let icon = null;

                          if (oIdx === res.correctAnswer) {
                            cardBg = "#e8f5e9";
                            borderCol = "#2e7d32";
                            textCol = "text-success fw-bold";
                            icon = <i className="bi bi-check-circle-fill me-2 text-success"></i>;
                          } else if (res.userAnswer !== null && oIdx === res.userAnswer && !res.isCorrect) {
                            cardBg = "#ffebee";
                            borderCol = "#c62828";
                            textCol = "text-danger fw-bold";
                            icon = <i className="bi bi-x-circle-fill me-2 text-danger"></i>;
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
                                  <span className="me-2 text-muted">{String.fromCharCode(65 + oIdx)}.</span>
                                  {cleanQuestionText(opt)}
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

                {/* Post-Test Control Panel */}
                <div className="text-center my-5 d-flex justify-content-center align-items-center gap-3 flex-wrap">
                  <button
                    onClick={retakeTest}
                    className="btn btn-outline-secondary px-4 py-3 fw-bold"
                    style={{ borderRadius: "30px" }}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i> Retake This Test
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

                  {/* Scroll to Top */}
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
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTest;
