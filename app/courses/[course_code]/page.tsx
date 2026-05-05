"use client";

import Link from "next/link";
// import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { cleanQuestionText } from "@/utils/textUtils";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import Button from "@/components/button/Button";
import LessonPlanTab, { Session } from "@/components/tabs/LessonPlanTab";
import CourseVideoTab, { VideoObject } from "@/components/tabs/CourseVideoTab";
import FreeTestTab, {
  Question,
  TestResult,
  TestResults,
  UserAnswers,
} from "@/components/tabs/FreeTestTab";

// Type definitions

interface CourseData {
  status: number;
  isSuccess: boolean;
  message: string;
  course_name?: string;
  full_form: string;
  course_header?: string;
  course_tagline?: string;
  overview?: string;
  curriculum?: string;
  sessions?: Session[];
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
  full_form: string;
  subscribe_button_url?: string;
  image?: string;
  name: string;
  details?: string;
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
                  marginBottom: "10px",
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

                <ul className="nav nav-tabs mb-4 responsive-tabs">
                  {/* Overview */}
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

                  {/* Curriculum */}
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

                  {/* Lesson Plan */}
                  <li className="nav-item">
                    <button
                      className={`nav-link tab-btn ${activeTab === 4 ? "active" : ""}`}
                      onClick={() => setActiveTab(4)}
                    >
                      Lesson Plan
                    </button>
                  </li>

                  {/* Course Video */}
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

                  {/* Online Free Test */}
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
                    <CourseVideoTab video={courseData.video} />
                  )}

                  {/* Online Free Test */}
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
              <div className={"text-center"}>
                <Button
                  pathname={`/package-details/1-on-1-tutoring/${encodeURIComponent(courseCode)}`}
                  className="btn-primary-custom2"
                >
                  Enroll Now
                </Button>
              </div>
            </div>

            {/* Sidebar: Related Courses */}

            <div className="col-lg-4">
              {courseData.related_courses &&
                courseData.related_courses.length > 0 && (
                  <div
                    className="related-courses-sidebar sticky-top p-lg-0 mt-lg-0"
                    style={{ top: "120px" }}
                  >
                    <h4 className="fs-3 fw-bold" style={{ color: "#e58a34" }}>
                      Other Courses
                      {location && ` ${location.replace(/-/g, " ")}`}
                    </h4>
                    {courseData.related_courses.map((course, i) => (
                      <Link
                        key={course.course_id || i}
                        href={`/courses/${encodeURIComponent(course.course_code)}`}
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
                              <span className="course-name">
                                {course.name}
                              </span>
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
