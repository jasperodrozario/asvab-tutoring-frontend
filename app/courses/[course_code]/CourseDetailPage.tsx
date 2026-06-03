"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cleanQuestionText } from "@/utils/textUtils";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Button from "@/components/button/Button";
import LessonPlanTab from "@/components/tabs/LessonPlanTab";
import CourseVideoTab, { VideoObject } from "@/components/tabs/CourseVideoTab";
import FreeTestTab, {
  TestResult,
  TestResults,
  UserAnswers,
} from "@/components/tabs/FreeTestTab";
import { processHtmlContent } from "@/lib/decode-html";
import type { CourseData, RelatedCourse } from "@/lib/course-types";

export type CourseDetailClientProps = {
  courseCode: string;
  courseData: CourseData | null;
  location?: string;
  breadcrumbSegments: string[];
  getRelatedCourseHref: (course: RelatedCourse) => string;
};

function formatLocationLabel(location: string): string {
  return location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CourseDetailClient({
  courseCode,
  courseData,
  location: locationProp = "",
  breadcrumbSegments,
  getRelatedCourseHref,
}: CourseDetailClientProps) {
  const searchParams = useSearchParams();
  const location =
    locationProp || searchParams?.get("location") || "";

  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});

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
    if (!courseData.ft_cat_list || !courseData.ft_ques_list) return;
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

  return (
    <>
      <div className="page-title-area text-white py-5">
        <div className="container text-center">
          <h2>{courseData.course_header?.toUpperCase() || "Course Title"}</h2>
          <h4>
            {courseData.course_tagline?.toUpperCase() || "Course Tagline"}
            {location && (
              <span>
                {" "}
                in <b>{formatLocationLabel(location)}</b>
              </span>
            )}
          </h4>
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
              {courseData.image_src && (
                <div className="mb-4 text-center">
                  <img
                    src={courseData.image_src}
                    alt={courseData.course_name || "Course Image"}
                    width={800}
                    height={350}
                    className="img-fluid rounded shadow-sm"
                  />
                </div>
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
                  {hasFreeTestQuestions && (
                    <li className="nav-item">
                      <button
                        className={`nav-link tab-btn ${activeTab === 3 ? "active" : ""}`}
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
                  {activeTab === 3 && (
                    <FreeTestTab
                      courseName={courseData.course_name}
                      ft_cat_list={courseData.ft_cat_list}
                      ft_ques_list={courseData.ft_ques_list}
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      testSubmitted={testSubmitted}
                      setTestSubmitted={setTestSubmitted}
                      testResults={testResults}
                      setTestResults={setTestResults}
                      userAnswers={userAnswers}
                      setUserAnswers={setUserAnswers}
                      handleAnswerChange={handleAnswerChange}
                      submitTest={submitTest}
                      retakeTest={retakeTest}
                    />
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
                        href={getRelatedCourseHref(course)}
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
                              {cleanQuestionText(course.details || "").substring(
                                0,
                                100,
                              ) +
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

export default function CourseDetailPageWrapper(props: CourseDetailClientProps) {
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
