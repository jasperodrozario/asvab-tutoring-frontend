"use client";

import Link from "next/link";
// import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Button from "@/components/button/Button";
import LessonPlanTab, { Session } from "@/components/tabs/LessonPlanTab";

// Type definitions

interface VideoObject {
  video_title?: string | string[];
  video_link?: string | string[];
  thumb_pic?: string | string[];
}

interface CourseData {
  status: number;
  isSuccess: boolean;
  message: string;
  sessions?: Session[];
  course_name?: string;
  course_header?: string;
  course_tagline?: string;
  overview?: string;
  curriculum?: string;
  picture?: string;
  video?: VideoObject;
  ft_cat_list?: string[];
  ft_ques_list?: { [key: string]: Question[] };
  courses?: Course[];
  faqs?: FAQ[];
  related_courses?: RelatedCourse[];
  total_ques?: number;
  image_src?: string;
}

interface Question {
  id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer: number;
}

interface Course {
  course_id: string;
  name: string;
}

interface FAQ {
  question: string;
  answers: string;
}

interface RelatedCourse {
  course_id: string;
  course_code: string;
  subscribe_button_url?: string;
  image?: string;
  name: string;
  details?: string;
}

interface TestResult {
  question: string;
  options: string[];
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
}

interface TestResults {
  score: number;
  totalQuestions: number;
  percentage: number;
  results: TestResult[];
}

interface UserAnswers {
  [key: string]: number;
}

// Utility functions

function cleanQuestionText(input: string): string {
  if (!input) return "";
  const txt = document.createElement("textarea");
  let decoded = input;
  let prev;
  do {
    prev = decoded;
    txt.innerHTML = decoded;
    decoded = txt.value;
  } while (decoded !== prev);

  decoded = decoded.replace(/<[^>]*>/g, "");
  decoded = decoded.replace(/\\\(|\\\)/g, "");
  decoded = decoded.replace(/\^(\d+)\/_({?)(\d+)(}?)/g, "$1/$3");
  return decoded.trim();
}

const processHtmlContent = (htmlString: string): string => {
  if (!htmlString) return "";
  if (typeof window !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<!DOCTYPE html><html><body>${htmlString}</body></html>`,
        "text/html",
      );
      return doc.body.innerHTML || "";
    } catch {
      return htmlString;
    }
  }
  return htmlString;
};

// Main Component
const CourseDetailPage: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [mounted, setMounted] = useState<boolean>(false);

  const courseCode =
    typeof params?.course_code === "string" ? params.course_code : "asvab";
  const location = searchParams?.get("location") || "";

  useEffect(() => setMounted(true), []);

  // Fetch course data function logic
  const fetchCourseData = async (): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append("action", "get-course-details-by-code");
      formData.append("course_code", courseCode);

      const response = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data && data.status === 200) {
        setCourseData({
          ...data,
          ft_cat_list: data.online_free_test_data?.categories || [],
          ft_ques_list: data.online_free_test_data?.questions || {},
        });
      } else setCourseData(null);
    } catch (error) {
      console.error("Error fetching course data:", error);
      setCourseData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course data on component mount
  useEffect(() => {
    fetchCourseData();
  }, [courseCode]);

  const hasVideo = (() => {
    if (!courseData) return false;
    const v = courseData.video;

    if (!v) return false;

    // object case from API
    if (typeof v === "object" && "video_link" in v) {
      const link = (v as VideoObject).video_link;
      if (typeof link === "string") {
        return link.trim().length > 0;
      }
      if (Array.isArray(link)) {
        return link.length > 0;
      }
    }
    return false;
  })();

  // Check if there are any questions available in ft_ques_list
  const hasFreeTestQuestions = (() => {
    if (!courseData?.ft_cat_list || courseData.ft_cat_list.length === 0)
      return false;
    if (!courseData?.ft_ques_list) return false;

    // Check if at least one category has questions
    return courseData.ft_cat_list.some((cat) => {
      const questions = courseData.ft_ques_list?.[cat];
      return Array.isArray(questions) && questions.length > 0;
    });
  })();

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
    if (!courseData?.ft_cat_list || !courseData?.ft_ques_list) return;
    const activeCategoryName = courseData.ft_cat_list[activeCategory];
    const questions = courseData.ft_ques_list[activeCategoryName] || [];
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
  };

  const retakeTest = (): void => {
    setTestSubmitted(false);
    setTestResults(null);
    setUserAnswers({});
  };

  // Loading or hydration states
  if (!mounted || loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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

  return (
    <>
      {/* Page Title */}
      <div className="page-title-area text-white py-5">
        <div className="container text-center">
          <h2>{courseData.course_header?.toUpperCase() || "Course Title"}</h2>
          <h4>
            {courseData.course_tagline?.toUpperCase() || "Course Tagline"}
            {location && (
              <span>
                {" "}
                in <b>{location.replace(/-/g, " ")}</b>
              </span>
            )}
          </h4>
          <Breadcrumb
            segments={["courses", courseCode]} // path segments
            dynamicTitle={courseData?.course_name} // pass course_name here
          />
        </div>
      </div>

      {/* Main Course Section */}
      <section className="single-course-area py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              {/* Course Image */}
              {courseData.image_src && (
                <div className="mb-4 text-center">
                  <img
                    src={courseData.image_src}
                    alt={courseData.course_name || "Course Image"}
                    width={800} // Adjust width as needed
                    height={350} // Adjust height as needed
                    className="img-fluid rounded shadow-sm"
                  />
                </div>
              )}

              {/* Tabs */}
              <div
                className="single-course-tab"
                style={{
                  border: "1px solid #cfd4d8",
                  borderRadius: "8px",
                  padding: "10px 18px 0px 18px",
                  marginBottom: "24px",
                  minHeight: "740px",
                }}
              >
                {/* <ul className="nav nav-tabs mb-4">
                                    {['Overview', 'Curriculum', 'Course Video', 'Online Free Test'].map((tab, i) => (
                                        <li key={i} className="nav-item">
                                            {i < 4 || (courseData.ft_cat_list && courseData.ft_cat_list.length > 0) ? (
                                                <button
                                                    className={`nav-link ${activeTab === i ? 'active' : ''}`}
                                                    onClick={() => { setActiveTab(i); if (i === 3) { setTestSubmitted(false); setTestResults(null); setUserAnswers({}) } }}
                                                >{tab}</button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul> */}

                <ul
                  className="nav nav-tabs mb-4"
                  style={{ borderBottom: "none" }}
                >
                  {/* Overview */}
                  {courseData.overview && courseData.overview.trim() !== "" && (
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 0 ? "active" : ""}`}
                        onClick={() => setActiveTab(0)}
                      >
                        Overview
                      </button>
                    </li>
                  )}

                  {/* Curriculum */}
                  {courseData.curriculum &&
                    courseData.curriculum.trim() !== "" && (
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 1 ? "active" : ""}`}
                          onClick={() => setActiveTab(1)}
                        >
                          Curriculum
                        </button>
                      </li>
                    )}

                  {/* Lesson Plan */}
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 4 ? "active" : ""}`}
                      onClick={() => setActiveTab(4)}
                    >
                      Lesson Plan
                    </button>
                  </li>

                  {/* Course Video */}
                  {hasVideo && (
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 2 ? "active" : ""}`}
                        onClick={() => setActiveTab(2)}
                      >
                        Course Video
                      </button>
                    </li>
                  )}

                  {/* Online Free Test */}
                  {hasFreeTestQuestions && (
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 3 ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab(3);
                          setTestSubmitted(false);
                          setTestResults(null);
                          setUserAnswers({});
                        }}
                      >
                        Online Free Test
                      </button>
                    </li>
                  )}
                </ul>


                {/* Tab Content */}

                <div className="tab-content">
                  {/* Overview Tab */}
                  {activeTab === 0 && (
                    <div className="overview-tab">
                      {/* {courseData.course_name && (
                                                <h3 className="mb-3"><b>{courseData.course_name}</b></h3>
                                            )} */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: processHtmlContent(
                            courseData.overview || "No description available",
                          ),
                        }}
                      />
                    </div>
                  )}
                  {/* Curriculum Tab */}
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

                  {/* Lesson Plan Tab */}
                  {activeTab === 4 && (
                    <div className="sessions-tab transition-fade">
                      <LessonPlanTab sessions={courseData.sessions} />
                    </div>
                  )}

                  {/* Course Video Tab */}
                  {activeTab === 2 && (
                    <div className="instructor-content">
                      <div className="row">
                        {(() => {
                          let videoArray: string[] = [];

                          if (courseData && courseData.video) {
                            const v = courseData.video;
                            if (typeof v.video_link === "string") {
                              videoArray = v.video_link
                                .split(",")
                                .map((x) => x.trim())
                                .filter((x) => x.length > 0);
                            } else if (Array.isArray(v)) {
                              videoArray = v
                                .map((x) => String(x).trim())
                                .filter((x) => x.length > 0);
                            } else if (v && typeof v === "object") {
                              const link = (v as VideoObject).video_link;
                              if (typeof link === "string") {
                                // This logic needs to be changed if custom video title is required.
                                videoArray = link
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter((x) => x.length > 0);
                              } else if (Array.isArray(link)) {
                                videoArray = link
                                  .map((x) => String(x).trim())
                                  .filter((x) => x.length > 0);
                              }
                            }
                            if (videoArray.length === 0) {
                              return (
                                <div
                                  className="col-12 text-center"
                                  style={{
                                    padding: "40px 20px",
                                    color: "#6c757d",
                                    fontSize: "1.1rem",
                                  }}
                                >
                                  <p>
                                    No video available to view at the moment.
                                  </p>
                                </div>
                              );
                            }

                            return videoArray.map((url, index) => (
                              <div key={index} className="col-12 mb-4">
                                <div
                                  style={{
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow:
                                      "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
                                    transition: "box-shadow 0.3s ease",
                                    backgroundColor: "#fff",
                                    padding: "8px",
                                    border: "1px solid #e0e0e0",
                                  }}
                                >
                                  <h2>{ }</h2>
                                  <iframe
                                    width="100%"
                                    height={415}
                                    src={url}
                                    title={`Course video player ${index + 1}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                      borderRadius: "8px",
                                      border: "none",
                                    }}
                                  />
                                </div>
                              </div>
                            ));
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Online Free Test */}
                  {activeTab === 3 &&
                    courseData.ft_cat_list &&
                    courseData.ft_ques_list && (
                      <div className="online-test-content container py-4">
                        <h3 className="text-center mb-4">
                          Free {courseData.course_name} Practice Test
                        </h3>

                        {/* Category Nav */}
                        <ul className="nav nav-pills mb-4">
                          {courseData.ft_cat_list.map((cat, idx) => (
                            <li key={idx} className="nav-item">
                              <button
                                className={`nav-link ${activeCategory === idx ? "active" : ""}`}
                                onClick={() => {
                                  setActiveCategory(idx);
                                  setTestSubmitted(false);
                                  setTestResults(null);
                                  setUserAnswers({});
                                }}
                                style={{
                                  backgroundColor:
                                    activeCategory === idx
                                      ? "#e58a34"
                                      : "transparent",
                                  color:
                                    activeCategory === idx
                                      ? "white"
                                      : "#495057",
                                }}
                              >
                                {cat}
                              </button>
                            </li>
                          ))}
                        </ul>

                        {/* Questions */}
                        {!testSubmitted ? (
                          courseData.ft_ques_list &&
                            courseData.ft_ques_list[
                            courseData.ft_cat_list[activeCategory]
                            ] ? (
                            courseData.ft_ques_list[
                              courseData.ft_cat_list[activeCategory]
                            ].map((q, qIdx) => {
                              const options = [
                                q.option_a,
                                q.option_b,
                                q.option_c,
                                q.option_d,
                              ].filter((opt): opt is string => opt != null);
                              return (
                                <div
                                  key={qIdx}
                                  className="card mb-4"
                                  style={{ borderLeft: "3px solid #ecc5a0ff" }}
                                >
                                  <div className="card-body">
                                    <div className="mb-3 fw-bold">
                                      {qIdx + 1}.{" "}
                                      {cleanQuestionText(q.question)}
                                    </div>
                                    {options.map((opt, oIdx) => (
                                      <div
                                        key={oIdx}
                                        className="form-check mb-2 d-flex align-items-center"
                                      >
                                        <input
                                          className="form-check-input"
                                          type="radio"
                                          name={`q-${activeCategory}-${qIdx}`}
                                          id={`q-${activeCategory}-${qIdx}-o-${oIdx}`}
                                          checked={
                                            userAnswers[
                                            `${activeCategory}-${qIdx}`
                                            ] === oIdx
                                          }
                                          onChange={() =>
                                            handleAnswerChange(
                                              activeCategory,
                                              qIdx,
                                              oIdx,
                                            )
                                          }
                                          style={{
                                            width: "1.5rem",
                                            height: "1.5rem",
                                            border: "2px solid #f0ad4e",
                                            borderRadius: "50%",
                                            cursor: "pointer",
                                            backgroundColor: "white",
                                            appearance: "none", // remove default small circle
                                            WebkitAppearance: "none",
                                            position: "relative",
                                          }}
                                        />
                                        <label
                                          className="form-check-label ms-2"
                                          htmlFor={`q-${activeCategory}-${qIdx}-o-${oIdx}`}
                                          style={{ cursor: "pointer" }}
                                        >
                                          {cleanQuestionText(opt)}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="alert alert-info text-center">
                              No questions available for this category.
                            </div>
                          )
                        ) : (
                          testResults && (
                            <div>
                              {/* <div className="alert alert-info text-center">
                                                            <h4>Test Results</h4>
                                                            <p>Score: {testResults.score}/{testResults.totalQuestions} ({testResults.percentage}%)</p>
                                                        </div> */}
                              {testResults.results.map((res, i) => (
                                <div
                                  key={i}
                                  className={`card mb-3 ${res.isCorrect ? "border-success" : "border-danger"}`}
                                >
                                  <div
                                    className={`card-header ${res.isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}
                                  >
                                    Question {i + 1}:{" "}
                                    {res.isCorrect ? "Correct" : "Incorrect"}
                                  </div>
                                  <div className="card-body">
                                    {/* Question */}
                                    <div>{cleanQuestionText(res.question)}</div>

                                    {/* Options */}
                                    <div>
                                      {res.options.map((opt, oIdx) => {
                                        let cls = "";
                                        if (oIdx === res.correctAnswer)
                                          cls = "text-success fw-bold";
                                        else if (
                                          res.userAnswer !== null &&
                                          oIdx === res.userAnswer &&
                                          !res.isCorrect
                                        )
                                          cls = "text-danger";

                                        return (
                                          <div
                                            key={oIdx}
                                            className={`my-2 p-2 rounded ${cls}`}
                                          >
                                            {String.fromCharCode(65 + oIdx)}.{" "}
                                            {cleanQuestionText(opt)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="alert alert-info text-center">
                                <h4>Test Results</h4>
                                <p>
                                  Score: {testResults.score}/
                                  {testResults.totalQuestions} (
                                  {testResults.percentage}%)
                                </p>
                              </div>
                            </div>
                          )
                        )}

                        {/* Submit / Retake Button */}
                        {courseData.ft_ques_list &&
                          courseData.ft_ques_list[
                          courseData.ft_cat_list[activeCategory]
                          ] &&
                          courseData.ft_ques_list[
                            courseData.ft_cat_list[activeCategory]
                          ].length > 0 && (
                            <div className="text-center my-4 d-flex justify-content-center align-items-center gap-3">
                              {!testSubmitted ? (
                                <button
                                  onClick={submitTest}
                                  className="btn btn-primary-custom mt-3"
                                >
                                  Submit Test
                                </button>
                              ) : (
                                <button
                                  onClick={retakeTest}
                                  className="btn btn-primary-custom mt-3"
                                >
                                  Retake This Test
                                </button>
                              )}

                              {/* Scroll to Top Button */}
                              <button
                                onClick={() => {
                                  const topElement =
                                    document.getElementById("top");
                                  if (topElement) {
                                    topElement.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                  } else {
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="btn btn-outline-secondary mt-3 d-flex align-items-center"
                                title="Go to Top"
                              >
                                <i className="bi bi-arrow-up-circle fs-5 me-1"></i>
                                Top
                              </button>
                            </div>
                          )}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Sidebar: Related Courses */}

            <div className="col-lg-4">
              {courseData.related_courses &&
                courseData.related_courses.length > 0 && (
                  <div
                    className="related-courses-sidebar sticky-top p-3 p-lg-0 mt-4 mt-lg-0"
                    style={{ top: "120px" }}
                  >
                    <h4 className="fw-bold mb-4" style={{ color: "#e58a34" }}>
                      Related Courses
                      {location && ` ${location.replace(/-/g, " ")}`}
                    </h4>
                    {courseData.related_courses.map((course, i) => (
                      <div key={i} className="card mb-3 related-course-card">
                        <Link
                          href={`/courses/${encodeURIComponent(course.course_code)}`}
                        >
                          <img
                            src={course.image || "/img/default-course.jpg"}
                            alt={course.name}
                            className="card-img-top"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        </Link>
                        <div className="card-body">
                          <Link
                            href={`/courses/${encodeURIComponent(course.course_code)}`}
                            className="text-decoration-none"
                          >
                            <h6
                              className="card-title mb-1 related-course-card-title"
                              style={{ color: "#002341", fontWeight: "600" }}
                            >
                              {cleanQuestionText(course.name)}
                            </h6>
                          </Link>
                          <p className="card-text small">
                            {cleanQuestionText(course.details || "").substring(
                              0,
                              100,
                            ) +
                              (course.details && course.details.length > 100
                                ? "..."
                                : "")}
                          </p>
                          {/* <a
                                                    href={course.subscribe_button_url || '#'}
                                                    className="btn btn-sm btn-primary w-100"
                                                >
                                                    Subscribe
                                                </a> */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          <div className={"text-center"}>
            <Button
              pathname={`/package-details/1-on-1-tutoring/${encodeURIComponent(courseCode)}`}
              className="btn-primary-custom2"
            >
              Enroll Now
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default function Page() {
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
      <CourseDetailPage />
    </Suspense>
  );
}
