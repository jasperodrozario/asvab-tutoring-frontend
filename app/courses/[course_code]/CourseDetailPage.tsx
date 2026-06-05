"use client";

import Link from "next/link";
// import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { cleanQuestionText } from "@/utils/textUtils";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
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

// Teams deep link configuration
const TEAMS_CONSULTATION_URL = "https://teams.microsoft.com/";

const TeamsLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="currentColor"
    className="bi bi-microsoft-teams"
    viewBox="0 0 16 16"
  >
    <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z" />
    <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z" />
  </svg>
);

function startTeamsChat(userEmail: string, messageTemplate: string) {
  const teamsDeepLink = `https://teams.microsoft.com/l/chat/0/0?users=${userEmail}&message=${encodeURIComponent(messageTemplate)}`;
  const teamsWebFallback = `https://teams.microsoft.com/chat/0/0?users=${userEmail}&message=${encodeURIComponent(messageTemplate)}`; // Fallback to Teams web

  // Attempt to open the deep link
  window.location.href = teamsDeepLink;

  // Set a timeout (e.g., 2500 milliseconds) to trigger the fallback
  // If the Teams app opens, the browser tab loses focus and the timer is less likely to matter.
  // If the deep link fails, the fallback will open a new tab.
  let fallbackTimer = setTimeout(function () {
    window.open(teamsWebFallback, "_blank");
  }, 2500);

  // Optional: Add an event listener for when the page regains focus.
  // If the user switches back quickly, the fallback might not be needed.
  window.addEventListener("blur", function onBlur() {
    clearTimeout(fallbackTimer);
    window.removeEventListener("blur", onBlur);
  });
}
/** End of Teams deep link configuration */

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

                  {/* Session Plan */}
                  <li className="nav-item">
                    <button
                      className={`nav-link tab-btn ${activeTab === 4 ? "active" : ""}`}
                      onClick={() => setActiveTab(4)}
                    >
                      Session Plan
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
              <div className="course-cta-section">
                <p className="course-cta-hint">
                  Choose how you&apos;d like to get started — message us on
                  Microsoft Teams for a free consultation, or enroll in tutoring
                  directly.
                </p>
                <div className="course-cta-actions">
                  <button
                    onClick={() =>
                      startTeamsChat(
                        "somdtutoring@gmail.com",
                        `Hello, I am interested in the ASVAB tutoring - ${courseData.course_name} course. I would like to get a free consultation.`,
                      )
                    }
                    rel="noopener noreferrer"
                    className="course-cta-btn course-cta-btn--teams"
                    aria-label="Get a free consultation on Microsoft Teams"
                  >
                    <TeamsLogo />
                    <span className="course-cta-btn-text">
                      <span className="course-cta-btn-title">
                        Free Consultation
                      </span>
                      <span className="course-cta-btn-subtitle">
                        Opens in Microsoft Teams
                      </span>
                    </span>
                  </button>
                  <Link
                    href={`/package-details/1-on-1-tutoring/${encodeURIComponent(courseCode)}`}
                    className="course-cta-btn course-cta-btn--enroll"
                  >
                    <span className="course-cta-btn-text">
                      <span className="course-cta-btn-title">Enroll Now</span>
                      <span className="course-cta-btn-subtitle">
                        View packages &amp; pricing
                      </span>
                    </span>
                  </Link>
                </div>
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
};

export default function CourseDetailPageWrapper() {
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
