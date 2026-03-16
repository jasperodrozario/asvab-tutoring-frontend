'use client';

import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

// Type definitions
interface CourseData {
    status?: number;
    isSuccess?: boolean;
    message?: string;
    course_name?: string;
    course_header?: string;
    course_tagline?: string;
    overview?: string;
    curriculum?: string;
    picture?: string;
    // video?: string;
    video?: string | string[];
    ft_cat_list?: string[];
    ft_ques_list?: { [key: string]: Question[] };
    courses?: Course[];
    faqs?: FAQ[];
    // similar_courses?: SimilarCourse[];
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
    if (!htmlString) return '';
    if (typeof window !== 'undefined') {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${htmlString}</body></html>`, 'text/html');
            return doc.body.innerHTML || '';
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

    const courseCode = typeof params?.courseCode === 'string' ? params.courseCode : '8';
    const location = searchParams?.get('location') || '';

    useEffect(() => setMounted(true), []);

    // Fetch course data
    const fetchCourseData = async (): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append("action", "get-course-details");
            formData.append("course_code", courseCode);

            const response = await fetch("https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php", { method: "POST", body: formData });
            const data = await response.json();
            console.log("API raw data:", data);

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

    useEffect(() => { fetchCourseData(); }, [courseCode]);

    const handleAnswerChange = (categoryIndex: number, questionIndex: number, optionIndex: number): void => {
        setUserAnswers(prev => ({ ...prev, [`${categoryIndex}-${questionIndex}`]: optionIndex }));
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
            const options = [question.option_a, question.option_b, question.option_c, question.option_d].filter((opt): opt is string => opt != null);
            return { question: question.question, options, userAnswer: userAnswer ?? null, correctAnswer, isCorrect };
        });

        setTestResults({ score, totalQuestions: questions.length, percentage: Math.round((score / questions.length) * 100), results });
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
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
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
                    <h2>{courseData.course_header?.toUpperCase() || 'Course Title'}</h2>
                    <h4>
                        {courseData.course_tagline?.toUpperCase() || 'Course Tagline'}
                        {location && <span> in <b>{location.replace(/-/g, ' ')}</b></span>}
                    </h4>
                    <Breadcrumb
                        segments={["course-detail", courseCode]} // path segments
                        dynamicTitle={courseData?.course_name}    // pass course_name here
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
                                        width={800}       // Adjust width as needed
                                        height={350}      // Adjust height as needed
                                        className="img-fluid rounded shadow-sm"
                                    />
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="single-course-tab">
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

                                <ul className="nav nav-tabs mb-4">
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
                                    {courseData.curriculum && courseData.curriculum.trim() !== "" && (
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 1 ? "active" : ""}`}
                                                onClick={() => setActiveTab(1)}
                                            >
                                                Curriculum
                                            </button>
                                        </li>
                                    )}

                                    {/* Course Video */}
                                    {courseData.video && courseData.video.length > 0 && (
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
                                    {courseData.ft_cat_list && courseData.ft_cat_list.length > 0 && (
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
                                            <div dangerouslySetInnerHTML={{
                                                __html: processHtmlContent(courseData.overview || 'No description available')
                                            }} />
                                        </div>
                                    )}
                                    {activeTab === 1 && <div dangerouslySetInnerHTML={{ __html: processHtmlContent(courseData.curriculum || 'No curriculum') }} />}

                                    {/* Course Video Tab */}
                                    {activeTab === 2 && (
                                        <div className="instructor-content">
                                            <div className="row">
                                                {(() => {
                                                    // ✅ Ensure TypeScript knows this is always a string array
                                                    let videoArray: string[] = [];

                                                    if (typeof courseData.video === "string") {
                                                        videoArray = courseData.video
                                                            .split(",")
                                                            .map((v) => v.trim())
                                                            .filter((v) => v.length > 0);
                                                    } else if (Array.isArray(courseData.video)) {
                                                        videoArray = courseData.video
                                                            .map((v) => String(v).trim())
                                                            .filter((v) => v.length > 0);
                                                    }

                                                    if (videoArray.length === 0) {
                                                        return (
                                                            <div className="col-12 text-center  ">
                                                                <p>No video available to view at the moment.</p>
                                                            </div>
                                                        );
                                                    }

                                                    return videoArray.map((url: string, index: number) => (
                                                        <div key={index} className="col-12 mb-4">
                                                            <iframe
                                                                width="100%"
                                                                height={415}
                                                                src={url}
                                                                title={`Course video player ${index + 1}`}
                                                                frameBorder={0}
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}


                                    {/* Online Free Test */}
                                    {activeTab === 3 && courseData.ft_cat_list && (
                                        <div className="online-test-content container py-4">
                                            <h3 className="text-center mb-4">Online Free Test</h3>

                                            {/* Category Nav */}
                                            <ul className="nav nav-pills mb-4">
                                                {courseData.ft_cat_list.map((cat, idx) => (
                                                    <li key={idx} className="nav-item">
                                                        <button className={`nav-link ${activeCategory === idx ? 'active' : ''}`}
                                                            onClick={() => { setActiveCategory(idx); setTestSubmitted(false); setTestResults(null); setUserAnswers({}) }}
                                                            style={{ backgroundColor: activeCategory === idx ? '#e58a34' : 'transparent', color: activeCategory === idx ? 'white' : '#495057' }}>
                                                            {cat}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* Questions */}
                                            {!testSubmitted ? (
                                                courseData.ft_ques_list && courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]] ?
                                                    courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]].map((q, qIdx) => {
                                                        const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter((opt): opt is string => opt != null);
                                                        return (
                                                            <div key={qIdx} className="card mb-4" style={{ borderLeft: '3px solid #ecc5a0ff' }}>
                                                                <div className="card-body">
                                                                    <div className="mb-3 fw-bold">{qIdx + 1}. {cleanQuestionText(q.question)}</div>
                                                                    {options.map((opt, oIdx) => (
                                                                        <div key={oIdx} className="form-check mb-2 d-flex align-items-center">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="radio"
                                                                                name={`q-${activeCategory}-${qIdx}`}
                                                                                id={`q-${activeCategory}-${qIdx}-o-${oIdx}`}
                                                                                checked={userAnswers[`${activeCategory}-${qIdx}`] === oIdx}
                                                                                onChange={() => handleAnswerChange(activeCategory, qIdx, oIdx)}
                                                                                style={{
                                                                                    width: '1.5rem',
                                                                                    height: '1.5rem',
                                                                                    border: '2px solid #f0ad4e',
                                                                                    borderRadius: '50%',
                                                                                    cursor: 'pointer',
                                                                                    backgroundColor: 'white',
                                                                                    appearance: 'none', // remove default small circle
                                                                                    WebkitAppearance: 'none',
                                                                                    position: 'relative',
                                                                                }}
                                                                            />
                                                                            <label
                                                                                className="form-check-label ms-2"
                                                                                htmlFor={`q-${activeCategory}-${qIdx}-o-${oIdx}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {cleanQuestionText(opt)}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                        )
                                                    })
                                                    : <div className="alert alert-info">No questions available for this category.</div>
                                            ) : (
                                                testResults && (
                                                    <div>
                                                        {/* <div className="alert alert-info text-center">
                                                            <h4>Test Results</h4>
                                                            <p>Score: {testResults.score}/{testResults.totalQuestions} ({testResults.percentage}%)</p>
                                                        </div> */}
                                                        {testResults.results.map((res, i) => (
                                                            <div key={i} className={`card mb-3 ${res.isCorrect ? 'border-success' : 'border-danger'}`}>
                                                                <div className={`card-header ${res.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                                    Question {i + 1}: {res.isCorrect ? 'Correct' : 'Incorrect'}
                                                                </div>
                                                                <div className="card-body">
                                                                    {/* Question */}
                                                                    <div>{cleanQuestionText(res.question)}</div>

                                                                    {/* Options */}
                                                                    <div>
                                                                        {res.options.map((opt, oIdx) => {
                                                                            let cls = '';
                                                                            if (oIdx === res.correctAnswer) cls = 'text-success fw-bold';
                                                                            else if (res.userAnswer !== null && oIdx === res.userAnswer && !res.isCorrect) cls = 'text-danger';

                                                                            return (
                                                                                <div key={oIdx} className={`my-2 p-2 rounded ${cls}`}>
                                                                                    {String.fromCharCode(65 + oIdx)}. {cleanQuestionText(opt)}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="alert alert-info text-center">
                                                            <h4>Test Results</h4>
                                                            <p>Score: {testResults.score}/{testResults.totalQuestions} ({testResults.percentage}%)</p>
                                                        </div>
                                                    </div>

                                                )
                                            )}

                                            {/* Submit / Retake Button */}
                                            {courseData.ft_ques_list &&
                                                courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]] &&
                                                courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]].length > 0 && (
                                                    <div className="text-center my-4 d-flex justify-content-center align-items-center gap-3">
                                                        {!testSubmitted ? (
                                                            <button onClick={submitTest} className="btn btn-primary-custom mt-3">
                                                                Submit Test
                                                            </button>
                                                        ) : (
                                                            <button onClick={retakeTest} className="btn btn-primary-custom mt-3">
                                                                Retake This Test
                                                            </button>
                                                        )}

                                                        {/* Scroll to Top Button */}
                                                        <button
                                                            onClick={() => {
                                                                const topElement = document.getElementById("top");
                                                                if (topElement) {
                                                                    topElement.scrollIntoView({ behavior: "smooth" });
                                                                } else {
                                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                                }
                                                            }}
                                                            className="btn btn-outline-secondary mt-3 d-flex align-items-center"
                                                            title="Go to Top"
                                                        >
                                                            <i className="bi bi-arrow-up-circle fs-5 me-1"></i> Top
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
                            {courseData.related_courses && courseData.related_courses.length > 0 && (
                                <div className="related-courses-sidebar sticky-top p-3 p-lg-0 mt-4 mt-lg-0" style={{ top: '120px' }}>
                                    <h4 className="fw-bold mb-4" style={{ color: '#e58a34' }}>
                                        Related Courses{location && ` ${location.replace(/-/g, ' ')}`}
                                    </h4>
                                    {courseData.related_courses.map((course, i) => (
                                        <div key={i} className="card mb-3">
                                            <Link href={`/course-detail/${encodeURIComponent(course.course_code)}`}>

                                                <img
                                                    src={course.image || '/img/default-course.jpg'}
                                                    alt={course.name}
                                                    className="card-img-top"
                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                />

                                            </Link>
                                            <div className="card-body p-2">
                                                <Link href={`/course-detail/${encodeURIComponent(course.course_code)}`} className="text-decoration-none">
                                                    <h6 className="card-title mb-1">{cleanQuestionText(course.name)}</h6>
                                                </Link>
                                                <p className="card-text small mb-2">
                                                    {cleanQuestionText(course.details || '').substring(0, 100) + (course.details && course.details.length > 100 ? '...' : '')}
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
                </div>
            </section>

        </>
    );
};

export default function Page() {
    return (
        <Suspense fallback={
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        }>
            <CourseDetailPage />
        </Suspense>
    );
}
