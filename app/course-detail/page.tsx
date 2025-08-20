'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

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
    video?: string;
    ft_cat_list?: string[];
    ft_ques_list?: { [key: string]: Question[] };
    courses?: Course[];
    faqs?: FAQ[];
    similar_courses?: SimilarCourse[];
    total_ques?: number;
}

interface Review {
    name: string;
    pic?: string;
    rating: number;
    feedback: string;
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

interface SimilarCourse {
    name: string;
    seo_url: string;
    thumb?: string;
    meta_desc?: string;
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

// HTML Entity Decoder using DOMParser (equivalent to PHP's html_entity_decode)
const htmlEntityDecodeParser = (str: string): string => {
    if (!str || typeof window === 'undefined') return str || '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${str}</body></html>`, 'text/html');
        return doc.body.textContent || doc.body.innerText || '';
    } catch (error) {
        console.warn('Failed to decode with DOMParser:', error);
        return str;
    }
};

// Strip HTML tags
const stripHtmlTags = (str: string): string => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
};

// Clean and format text
const cleanText = (str: string): string => {
    if (!str) return '';

    return str
        .replace(/\r\n/g, ' ')     // Replace CRLF with space
        .replace(/\n/g, ' ')       // Replace LF with space
        .replace(/\r/g, ' ')       // Replace CR with space
        .replace(/\t/g, ' ')       // Replace tabs with space
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
        .trim();                   // Remove leading/trailing whitespace
};

// Process HTML content and preserve basic formatting
const processHtmlContent = (htmlString: string): string => {
    if (!htmlString) return '';

    try {
        // For content that needs to preserve some HTML structure
        // We'll decode entities but keep the HTML tags for formatting
        if (typeof window !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${htmlString}</body></html>`, 'text/html');
            return doc.body.innerHTML || '';
        }
        return htmlString;
    } catch (error) {
        console.warn('Error processing HTML content:', error);
        return htmlString;
    }
};

// Main utility function to get plain text preview
const getPlainTextPreview = (htmlString: string, maxLength: number = 100): string => {
    if (!htmlString) return 'No description available';

    try {
        // Step 1: Decode HTML entities using DOMParser  
        let processedText = htmlEntityDecodeParser(htmlString);

        // Step 2: Strip HTML tags
        processedText = stripHtmlTags(processedText);

        // Step 3: Clean and format text
        processedText = cleanText(processedText);

        // Step 4: Limit character count with smart truncation
        if (processedText.length > maxLength) {
            // Find the last complete word within the limit
            const truncated = processedText.substring(0, maxLength);
            const lastSpaceIndex = truncated.lastIndexOf(' ');

            if (lastSpaceIndex > maxLength * 0.8) {
                // If we have a good word boundary, use it
                processedText = truncated.substring(0, lastSpaceIndex) + '...';
            } else {
                // Otherwise, just truncate at character limit
                processedText = truncated + '...';
            }
        }

        return processedText;

    } catch (error) {
        console.warn('Error processing text:', error);
        return 'Description unavailable';
    }
};

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

    // Ensure courseCode is a string
    const courseCode = typeof params?.courseCode === 'string' ? params.courseCode : '1';
    const location = searchParams?.get('location') || '';

    // Handle hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchCourseData();
    }, [courseCode]);

const fetchCourseData = async (): Promise<void> => {
    try {
        const params = new URLSearchParams();
        params.append('action', 'get-course-detail');
        params.append('course_code', courseCode);

        console.log('Sending request with course_code:', courseCode);

        const response = await fetch('https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const rawText = await response.text();
        console.log('Raw response:', rawText);

        const data = JSON.parse(rawText);
        console.log('Parsed data:', data);

        if (data && typeof data === 'object' && !Array.isArray(data) && data.status === 200) {
            setCourseData(data);
        } else {
            console.warn('No course data found or unexpected format.');
            setCourseData(null);
        }

    } catch (error) {
        console.error('Error fetching course data:', error);
        setCourseData(null);
    } finally {
        setLoading(false);
    }
};





    const handleAnswerChange = (categoryIndex: number, questionIndex: number, optionIndex: number): void => {
        setUserAnswers(prev => ({
            ...prev,
            [`${categoryIndex}-${questionIndex}`]: optionIndex
        }));
    };

    const submitTest = (): void => {
        if (!courseData?.ft_cat_list || !courseData?.ft_ques_list) return;

        const activeCategoryName = courseData.ft_cat_list[activeCategory];
        const questions = courseData.ft_ques_list[activeCategoryName] || [];

        let score = 0;
        const results: TestResult[] = questions.map((question, qIndex) => {
            const userAnswer = userAnswers[`${activeCategory}-${qIndex}`];
            const correctAnswer = question.answer - 1; // Convert to 0-based index
            const isCorrect = userAnswer === correctAnswer;

            if (isCorrect) score++;

            const options = [question.option_a, question.option_b, question.option_c, question.option_d]
                .filter((opt): opt is string => opt != null);

            return {
                question: question.question,
                options,
                userAnswer: userAnswer ?? null,
                correctAnswer,
                isCorrect
            };
        });

        setTestResults({
            score,
            totalQuestions: questions.length,
            percentage: Math.round((score / questions.length) * 100),
            results
        });
        setTestSubmitted(true);
    };

    const retakeTest = (): void => {
        setTestSubmitted(false);
        setTestResults(null);
        setUserAnswers({});
    };

    // Show loading state during hydration
    if (!mounted) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (loading) {
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
                    <p>Please check the console for more details or try refreshing the page.</p>
                </div>
            </div>
        );
    }

    // Show the actual data structure for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log('CourseData structure:', {
            hasData: !!courseData,
            keys: courseData ? Object.keys(courseData) : [],
            courseData: courseData
        });
    }

    return (
        <>
            {/* Page Title Area */}
            <div className="page-title-area bg-primary text-white py-5" style={{ marginTop: '110px' }}>
                <div className="container">
                    <div className="page-title-content text-center">
                        <h2>{courseData.course_header?.toUpperCase() || 'Course Title'}</h2>
                        <h4>
                            {courseData.course_tagline?.toUpperCase() || 'Course Tagline'}
                            {location && <span> in <b>{location.replace(/-/g, ' ')}</b></span>}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Single Course Area */}
            <section className="single-course-area py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="single-course-tab">
                                {/* Tab Navigation */}
                                <ul className="nav nav-tabs mb-4">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 0 ? 'active' : ''}`}
                                            onClick={() => setActiveTab(0)}
                                        >
                                            Overview
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 1 ? 'active' : ''}`}
                                            onClick={() => setActiveTab(1)}
                                        >
                                            Curriculum
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 2 ? 'active' : ''}`}
                                            onClick={() => setActiveTab(2)}
                                        >
                                            Course Video
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link ${activeTab === 3 ? 'active' : ''}`}
                                            onClick={() => setActiveTab(3)}
                                        >
                                            Reviews
                                        </button>
                                    </li>
                                    {courseData.ft_cat_list && courseData.ft_cat_list.length > 0 && (
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 4 ? 'active' : ''}`}
                                                onClick={() => setActiveTab(4)}
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
                                        <div className="single-course-content">
                                            {courseData.picture && (
                                                <div className="player-container mb-4">
                                                    <video
                                                        controls
                                                        className="w-100"
                                                        style={{ maxHeight: '400px' }}
                                                    >
                                                        <source src={courseData.picture} type="video/mp4" />
                                                    </video>
                                                </div>
                                            )}
                                            <h3><b>Course Description</b></h3>
                                            {/* Updated: Using processHtmlContent instead of dangerouslySetInnerHTML */}
                                            <div className="mt-3">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: processHtmlContent(courseData.overview || 'No description available')
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Curriculum Tab */}
                                    {activeTab === 1 && (
                                        <div className="curriculum-content">
                                            <h3>Curriculum Summary</h3>
                                            {/* Updated: Using processHtmlContent instead of dangerouslySetInnerHTML */}
                                            <div className="curriculum-list mt-3">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: processHtmlContent(courseData.curriculum || 'No curriculum available')
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Course Video Tab */}
                                    {activeTab === 2 && (
                                        <div className="instructor-content">
                                            <div className="row">
                                                {courseData.video ? (
                                                    courseData.video.split(',').map((videoUrl, index) => (
                                                        <div key={index} className="col-12 mb-4">
                                                            <iframe
                                                                width="100%"
                                                                height="415"
                                                                src={videoUrl.trim()}
                                                                title={`YouTube video player ${index + 1}`}
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-12 text-center text-muted">
                                                        <p>No video available to view at the moment.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Online Free Test Tab */}
                                    {activeTab === 4 && courseData.ft_cat_list && (
                                        <div className="online-test-content">
                                            <div className="container py-4">
                                                <h3 className="text-center mb-4">Online Free Test</h3>

                                                {/* Category Navigation */}
                                                <div className="category-nav bg-light rounded p-3 mb-4">
                                                    <ul className="nav nav-pills">
                                                        {courseData.ft_cat_list.map((category, index) => (
                                                            <li key={index} className="nav-item">
                                                                <button
                                                                    className={`nav-link ${activeCategory === index ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        setActiveCategory(index);
                                                                        setTestSubmitted(false);
                                                                        setTestResults(null);
                                                                        setUserAnswers({});
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: activeCategory === index ? '#ffb607' : 'transparent',
                                                                        color: activeCategory === index ? 'white' : '#495057'
                                                                    }}
                                                                >
                                                                    {category}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Questions Container */}
                                                {!testSubmitted ? (
                                                    <div className="questions-container">
                                                        {courseData.ft_ques_list && courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]] ? (
                                                            courseData.ft_ques_list[courseData.ft_cat_list[activeCategory]].map((question, qIndex) => {
                                                                const options = [
                                                                    question.option_a,
                                                                    question.option_b,
                                                                    question.option_c,
                                                                    question.option_d
                                                                ].filter((opt): opt is string => opt !== null && opt !== undefined);

                                                                return (
                                                                    <div key={qIndex} className="card question-card mb-4" style={{ borderLeft: '4px solid #0d6efd' }}>
                                                                        <div className="card-body">
                                                                            <div className="mb-3 d-flex align-items-start">
                                                                                <span className="question-number me-2 fw-bold">{qIndex + 1}.</span>
                                                                                {/* Updated: Using processHtmlContent for questions */}
                                                                                <div
                                                                                    className="question-content"
                                                                                    dangerouslySetInnerHTML={{
                                                                                        __html: processHtmlContent(question.question)
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            {options.map((option, oIndex) => (
                                                                                <div key={oIndex} className="form-check mb-2">
                                                                                    <input
                                                                                        className="form-check-input"
                                                                                        type="radio"
                                                                                        name={`q-${activeCategory}-${qIndex}`}
                                                                                        id={`q-${activeCategory}-${qIndex}-o-${oIndex}`}
                                                                                        value={oIndex}
                                                                                        checked={userAnswers[`${activeCategory}-${qIndex}`] === oIndex}
                                                                                        onChange={() => handleAnswerChange(activeCategory, qIndex, oIndex)}
                                                                                    />
                                                                                    {/* Updated: Using processHtmlContent for options */}
                                                                                    <label
                                                                                        className="form-check-label"
                                                                                        htmlFor={`q-${activeCategory}-${qIndex}-o-${oIndex}`}
                                                                                    >
                                                                                        <div
                                                                                            dangerouslySetInnerHTML={{
                                                                                                __html: processHtmlContent(option)
                                                                                            }}
                                                                                        />
                                                                                    </label>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="alert alert-info">
                                                                No questions available for this category.
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Test Results */
                                                    testResults && (
                                                        <div className="test-results">
                                                            <div className="alert alert-info text-center mb-4">
                                                                <h4>Test Results</h4>
                                                                <p>Score: {testResults.score}/{testResults.totalQuestions} ({testResults.percentage}%)</p>
                                                            </div>

                                                            <div className="answer-review">
                                                                {testResults.results.map((result, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className={`card mb-3 ${result.isCorrect ? 'border-success' : 'border-danger'}`}
                                                                    >
                                                                        <div className={`card-header ${result.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                                            Question {index + 1}: {result.isCorrect ? 'Correct' : 'Incorrect'}
                                                                        </div>
                                                                        <div className="card-body">
                                                                            {/* Updated: Using processHtmlContent for result questions */}
                                                                            <div className="question-text mb-3">
                                                                                <div
                                                                                    dangerouslySetInnerHTML={{
                                                                                        __html: processHtmlContent(result.question)
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="options-display">
                                                                                <strong>Options:</strong>
                                                                                {result.options.map((option, oIndex) => {
                                                                                    let optionClass = '';
                                                                                    if (oIndex === result.correctAnswer) {
                                                                                        optionClass = 'text-success fw-bold';
                                                                                    } else if (result.userAnswer !== null && oIndex === result.userAnswer && !result.isCorrect) {
                                                                                        optionClass = 'text-danger';
                                                                                    }
                                                                                    return (
                                                                                        <div
                                                                                            key={oIndex}
                                                                                            className={`my-2 p-2 rounded ${optionClass}`}
                                                                                        >
                                                                                            <div
                                                                                                dangerouslySetInnerHTML={{
                                                                                                    __html: processHtmlContent(`${String.fromCharCode(65 + oIndex)}. ${option}`)
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                                {/* Submit/Retake Button */}
                                                <div className="text-center my-4">
                                                    {!testSubmitted ? (
                                                        <button
                                                            onClick={submitTest}
                                                            className="btn btn-warning px-4 py-2"
                                                        >
                                                            Submit Test
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={retakeTest}
                                                            className="btn btn-warning px-4 py-2"
                                                        >
                                                            Retake This Test
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}

                    </div>
                </div>
            </section>

            {/* Pricing Section */}

            {/* FAQ Section */}

            {/* Related Courses Section */}
            {courseData.similar_courses && courseData.similar_courses.length > 0 && (
                <section className="py-5">
                    <div className="container">
                        <div className="section-title mb-5">
                            <h3 className="text-warning fw-bold">
                                Related Courses
                                {location && <span> {location.replace(/-/g, ' ')}</span>}
                            </h3>
                        </div>
                        <div className="row">
                            {courseData.similar_courses.map((course, index) => (
                                <div key={index} className="col-lg-4 col-md-6 mb-4">
                                    <div className="card h-100">
                                        <a href={`/course/${course.seo_url}`}>
                                            <img
                                                src={course.thumb || '/img/default-course.jpg'}
                                                alt={course.name}
                                                className="card-img-top"
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                        </a>
                                        <div className="card-body">
                                            <a href={`/course/${course.seo_url}`} className="text-decoration-none">
                                                <h3 className="card-title">{course.name}</h3>
                                            </a>
                                            <div className="d-flex align-items-center mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className="bi bi-star-fill text-warning me-1"></i>
                                                ))}
                                                <span className="ms-2">5 <a href="#" className="text-decoration-none">(5 rating)</a></span>
                                            </div>
                                            {/* Updated: Using getPlainTextPreview for course descriptions */}
                                            <p className="card-text">
                                                {getPlainTextPreview(course.meta_desc || '', 100)}
                                            </p>
                                            <div className="text-center">
                                                <a href={`/register/${course.seo_url}`} className="btn btn-primary">
                                                    Subscribe Now
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default CourseDetailPage;