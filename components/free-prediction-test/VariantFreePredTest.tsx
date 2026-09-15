"use client";

import { useState } from "react";
import FreePredTest from "./FreePredTest";
import TestGradeSelector from "@/components/free-test/TestGradeSelector";
import type { PackagesByService } from "@/lib/package-types";
import type { FreePredTestVariant } from "@/lib/prediction-test-types";

type VariantFreePredTestProps = {
  courseName: string;
  predictionTestName?: string;
  courseCode: string;
  /** One entry per grade, already filtered to grades with a complete test. */
  variants: FreePredTestVariant[];
  packagesByService?: PackagesByService;
};

export default function VariantFreePredTest({
  courseName,
  predictionTestName,
  courseCode,
  variants,
  packagesByService,
}: VariantFreePredTestProps) {
  const [selectedGradeId, setSelectedGradeId] = useState(
    String(variants[0]?.main_course_id ?? ""),
  );

  const activeVariant =
    variants.find(
      (variant) => String(variant.main_course_id) === selectedGradeId,
    ) ?? variants[0];

  const gradeSelector = (
    <TestGradeSelector
      variant="prediction"
      options={variants}
      value={String(activeVariant?.main_course_id ?? "")}
      onChange={setSelectedGradeId}
    />
  );

  return (
    <FreePredTest
      // Remounting on grade change discards answers and scores from the
      // previous grade.
      key={String(activeVariant?.main_course_id ?? "")}
      courseName={courseName}
      predictionTestName={predictionTestName}
      courseCode={courseCode}
      // Scoring is keyed on the grade's own course id, not the parent's.
      courseId={Number(activeVariant?.data?.course_id ?? 0)}
      ft_categories={activeVariant?.data?.categories}
      ft_ques_list={activeVariant?.data?.questions}
      packagesByService={packagesByService}
      headerSlot={gradeSelector}
    />
  );
}
