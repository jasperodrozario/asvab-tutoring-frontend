import React from 'react';
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

interface FreeTestTabProps {
  courseName?: string;
  ft_cat_list?: string[];
  ft_ques_list?: { [key: string]: Question[] };
  activeCategory: number;
  setActiveCategory: (idx: number) => void;
  testSubmitted: boolean;
  setTestSubmitted: (val: boolean) => void;
  testResults: TestResults | null;
  setTestResults: (results: TestResults | null) => void;
  userAnswers: UserAnswers;
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  handleAnswerChange: (catIdx: number, qIdx: number, oIdx: number) => void;
  submitTest: () => void;
  retakeTest: () => void;
}

const FreeTestTab: React.FC<FreeTestTabProps> = ({
  courseName,
  ft_cat_list,
  ft_ques_list,
  activeCategory,
  setActiveCategory,
  testSubmitted,
  setTestSubmitted,
  testResults,
  setTestResults,
  userAnswers,
  setUserAnswers,
  handleAnswerChange,
  submitTest,
  retakeTest,
}) => {
  if (!ft_cat_list || !ft_ques_list) return null;

  return (
    <div className="online-test-content container py-4">
      <h3 className="text-center mb-4">Free {courseName} Practice Test</h3>

      {/* Category Nav */}
      <ul className="nav nav-pills mb-4">
        {ft_cat_list.map((cat, idx) => (
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
                  activeCategory === idx ? "#e58a34" : "transparent",
                color: activeCategory === idx ? "white" : "#495057",
              }}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>

      {/* Questions */}
      {!testSubmitted ? (
        ft_ques_list[ft_cat_list[activeCategory]] ? (
          ft_ques_list[ft_cat_list[activeCategory]].map((q, qIdx) => {
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
                    {qIdx + 1}. {cleanQuestionText(q.question)}
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
                          userAnswers[`${activeCategory}-${qIdx}`] === oIdx
                        }
                        onChange={() =>
                          handleAnswerChange(activeCategory, qIdx, oIdx)
                        }
                        style={{
                          width: "1.5rem",
                          height: "1.5rem",
                          border: "2px solid #f0ad4e",
                          borderRadius: "50%",
                          cursor: "pointer",
                          backgroundColor: "white",
                          appearance: "none",
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
            {testResults.results.map((res, i) => (
              <div
                key={i}
                className={`card mb-3 ${
                  res.isCorrect ? "border-success" : "border-danger"
                }`}
              >
                <div
                  className={`card-header ${
                    res.isCorrect ? "bg-success text-white" : "bg-danger text-white"
                  }`}
                >
                  Question {i + 1}: {res.isCorrect ? "Correct" : "Incorrect"}
                </div>
                <div className="card-body">
                  <div>{cleanQuestionText(res.question)}</div>
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
              <p>
                Score: {testResults.score}/{testResults.totalQuestions} (
                {testResults.percentage}%)
              </p>
            </div>
          </div>
        )
      )}

      {/* Submit / Retake Button */}
      {ft_ques_list[ft_cat_list[activeCategory]] &&
        ft_ques_list[ft_cat_list[activeCategory]].length > 0 && (
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
                const topElement = document.getElementById("top");
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
  );
};

export default FreeTestTab;
