import {
  FREE_TEST_QUESTION_COUNT,
  getFreeTestCategoryNames,
  type FreePracticeTestQuestion,
  type FreeTestCategory,
  type PreparedTestQuestion,
} from "@/lib/course-types";

export type FreePredTestCategory = FreeTestCategory;

export interface FreePredTestQuestion extends FreePracticeTestQuestion {
  cat_id?: number | string;
  qid?: number | string;
}

export interface FreePredTestData {
  course_id: number;
  categories: FreeTestCategory[];
  questions: { [category: string]: FreePredTestQuestion[] };
}

export interface FreePredTestResponse {
  status: number;
  isSuccess: boolean;
  message: string;
  course_name?: string;
  prediction_test_name?: string;
  course_code?: string;
  full_form?: string;
  data?: FreePredTestData;
}

export interface CategoryScore {
  num_correct_ans: number | string;
  num_wrong_ans: number | string;
  total_question: number | string;
  score?: number | string;
}

export interface FreePredTestScoreResponse {
  pred_test_name?: string;
  pred_score?: number;
  cat_scores?: Record<string, CategoryScore>;
  message?: string;
}

export interface PredScoreFeedback {
  title: string;
  message: string;
  color: string;
  iconClass: string;
  badgeText: string;
}

export function getPredScoreFeedback(score: number): PredScoreFeedback {
  if (score >= 75) {
    return {
      title: "Excellence Achieved!",
      message: `You scored ${score} in your test. You are highly likely to pass the real exam with this level of preparation.`,
      color: "#198754",
      iconClass: "bi-check-circle-fill",
      badgeText: "Excellence",
    };
  }

  if (score >= 60) {
    return {
      title: "Good Progress!",
      message: `You scored ${score}. Great score! Keep practicing to further solidify your knowledge and guarantee a pass.`,
      color: "#e58a34",
      iconClass: "bi-info-circle-fill",
      badgeText: "Good Progress",
    };
  }

  return {
    title: "Focus Required",
    message: `You scored ${score}. Your score is currently below the target for a successful pass. Consistent practice will help you improve.`,
    color: "#dc3545",
    iconClass: "bi-exclamation-triangle-fill",
    badgeText: "Focus Required",
  };
}

export function hasFreePredTestQuestions(
  categories?: FreeTestCategory[],
  questions?: { [key: string]: FreePredTestQuestion[] },
): boolean {
  if (!categories?.length || !questions) return false;
  return getFreeTestCategoryNames(categories).some((cat) => {
    const qs = questions[cat];
    return Array.isArray(qs) && qs.length > 0;
  });
}

export function isFreePredTestReady(
  categories?: FreeTestCategory[],
  questions?: { [key: string]: FreePredTestQuestion[] },
): boolean {
  if (!categories?.length || !questions) return false;
  return getFreeTestCategoryNames(categories).every(
    (cat) => (questions[cat]?.length ?? 0) >= FREE_TEST_QUESTION_COUNT,
  );
}

export function prepareFreePredTestQuestions(
  categories: FreeTestCategory[],
  questions: { [key: string]: FreePredTestQuestion[] },
): {
  sufficient: boolean;
  questionsByCategory: { [key: string]: FreePredTestQuestion[] };
} {
  const categoryNames = getFreeTestCategoryNames(categories);
  const sufficient = isFreePredTestReady(categories, questions);

  if (!sufficient) {
    return { sufficient: false, questionsByCategory: {} };
  }

  const questionsByCategory = Object.fromEntries(
    categoryNames.map((cat) => [cat, questions[cat] ?? []]),
  );

  return { sufficient: true, questionsByCategory };
}

export function getCategoryCatId(questions: FreePredTestQuestion[]): number {
  const first = questions[0];
  if (!first?.cat_id) return 0;
  return Number(first.cat_id);
}

export interface PredTestScorePayload {
  course_id: string;
  pred_cat_ids: string;
  cat_correct_answers: string;
  cat_total_num_of_ques: string;
}

export function buildPredTestScorePayload(
  categories: FreeTestCategory[],
  questionsByCategory: {
    [key: string]: PreparedTestQuestion<FreePredTestQuestion>[];
  },
  courseId: number,
  userAnswers: Record<string, number>,
): PredTestScorePayload {
  const categoryNames = getFreeTestCategoryNames(categories);
  const predCatIds: number[] = [];
  const correctCounts: number[] = [];
  const totals: number[] = [];

  categoryNames.forEach((catName, catIdx) => {
    const qs = questionsByCategory[catName] ?? [];
    predCatIds.push(getCategoryCatId(qs.map((pq) => pq.question)));
    totals.push(qs.length);
    correctCounts.push(
      qs.reduce((count, pq, qIdx) => {
        const userAnswer = userAnswers[`${catIdx}-${qIdx}`];
        return userAnswer === pq.correctAnswerIndex ? count + 1 : count;
      }, 0),
    );
  });

  return {
    course_id: String(courseId),
    pred_cat_ids: predCatIds.join(","),
    cat_correct_answers: correctCounts.join(","),
    cat_total_num_of_ques: totals.join(","),
  };
}
