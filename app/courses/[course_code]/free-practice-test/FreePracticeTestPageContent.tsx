import { notFound } from "next/navigation";
import FreeTest from "@/components/free-test/FreeTest";
import VariantFreeTest from "@/components/free-test/VariantFreeTest";
import AsvabResourceLinks from "@/components/asvab/AsvabResourceLinks";
import {
  getFreeTestCategoryNames,
  getReadyFreeTestVariants,
} from "@/lib/course-types";
import { findFreePracticeTestSubjectIndex } from "@/lib/free-practice-test-routes";
import { isKnownCourseCode } from "@/lib/known-route-validation";
import {
  fetchAllPackageDetailsForCourse,
  fetchFreePracticeTestByCode,
  fetchFreePredTestByCode,
  isCoursePublishable,
} from "@/lib/php-api";
import { isFreePredTestResponseReady } from "@/lib/prediction-test-types";

type Props = {
  courseCode: string;
  subjectSlug?: string;
};

export default async function FreePracticeTestPageContent({
  courseCode,
  subjectSlug,
}: Props) {
  if (!isKnownCourseCode(courseCode)) notFound();
  if (!(await isCoursePublishable(courseCode))) notFound();

  const [freeTestData, packagesByService, predTestData] = await Promise.all([
    fetchFreePracticeTestByCode(courseCode),
    fetchAllPackageDetailsForCourse(courseCode),
    fetchFreePredTestByCode(courseCode),
  ]);

  if (!freeTestData?.data) notFound();

  const hasFreePredTest = isFreePredTestResponseReady(predTestData);
  const gradeVariants = getReadyFreeTestVariants(freeTestData.variants);

  if (subjectSlug) {
    const availableSubjectNames =
      gradeVariants.length > 0
        ? gradeVariants.flatMap((variant) =>
            getFreeTestCategoryNames(variant.data?.categories ?? []),
          )
        : getFreeTestCategoryNames(freeTestData.data.categories);

    if (
      findFreePracticeTestSubjectIndex(availableSubjectNames, subjectSlug) < 0
    ) {
      notFound();
    }
  }

  const test =
    gradeVariants.length > 0 ? (
      <VariantFreeTest
        courseName={freeTestData.course_name}
        courseCode={courseCode}
        variants={gradeVariants}
        packagesByService={packagesByService}
        hasFreePredTest={hasFreePredTest}
        initialSubjectSlug={subjectSlug}
      />
    ) : (
      <FreeTest
        courseName={freeTestData.course_name}
        courseCode={courseCode}
        ft_categories={freeTestData.data.categories}
        ft_ques_list={freeTestData.data.questions}
        packagesByService={packagesByService}
        hasFreePredTest={hasFreePredTest}
        initialSubjectSlug={subjectSlug}
      />
    );

  return (
    <>
      {test}
      {courseCode === "asvab" ? (
        <div className="container">
          <AsvabResourceLinks
            paths={["/asvab-math-practice-test", "/asvab-study-guide"]}
          />
        </div>
      ) : null}
    </>
  );
}
