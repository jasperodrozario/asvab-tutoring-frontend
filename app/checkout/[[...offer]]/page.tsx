import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";
import OfferCheckout from "./OfferCheckout";
import { resolveCheckoutPackageSummary } from "@/lib/checkout-package-info";
import { fetchStateTestPreparationCourses } from "@/lib/php-api";
import {
  isStateMathTestPrepCheckoutCourse,
  isStateMathTestPrepProduct,
} from "@/lib/state-math-test";

function firstParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ offer?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { offer } = await params;
  const offerSlug = Array.isArray(offer) ? offer[0] : offer;
  const sp = await searchParams;

  const courseId = firstParam(sp.course_id);
  const requiresGradeSelection =
    isStateMathTestPrepCheckoutCourse(courseId) ||
    isStateMathTestPrepProduct(firstParam(sp.product));

  const [packageSummary, stateMathGrades] = await Promise.all([
    resolveCheckoutPackageSummary({
      courseId,
      packageId: firstParam(sp.package_id),
      mode: firstParam(sp.mode),
      tutoringType:
        firstParam(sp.tutoring_type) || firstParam(sp.package_type),
    }),
    requiresGradeSelection
      ? fetchStateTestPreparationCourses()
      : Promise.resolve([]),
  ]);

  if (offerSlug === "limited-time-offer") {
    return (
      <Suspense
        fallback={
          <div className="container py-5 text-center text-muted">
            Loading special offer checkout...
          </div>
        }
      >
        <OfferCheckout
          packageSummary={packageSummary}
          stateMathGrades={stateMathGrades}
          requiresGradeSelection={requiresGradeSelection}
        />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={<div className="container py-5">Loading checkout…</div>}
    >
      <CheckoutContent
        packageSummary={packageSummary}
        stateMathGrades={stateMathGrades}
        requiresGradeSelection={requiresGradeSelection}
      />
    </Suspense>
  );
}
