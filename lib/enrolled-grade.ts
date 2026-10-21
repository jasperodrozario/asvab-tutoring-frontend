import type { CourseVariantOption } from "@/lib/course-types";
import { phpEnrolledCourseLookup } from "@/lib/auth-php";
import { parseHasVariants } from "@/lib/package-utils";
import { fetchAllCoursesRaw } from "@/lib/php-api";

type AccountSession = {
  auth_token: string;
  user_id: number | string;
};

/** Grade from `variants` the account is already registered on, or null. */
export async function resolveEnrolledCheckoutGrade(
  variants: readonly CourseVariantOption[],
  session: AccountSession | null,
): Promise<CourseVariantOption | null> {
  if (!session?.auth_token || !session.user_id || variants.length === 0) {
    return null;
  }

  const enrolled = await phpEnrolledCourseLookup(
    session.auth_token,
    session.user_id,
  );
  if (!enrolled || enrolled.is_variant !== 1) return null;

  return (
    variants.find(
      (variant) => String(variant.main_course_id) === enrolled.main_course_id,
    ) ?? null
  );
}

/**
 * Payment identity for a logged-in account. A posted grade is replaced by the
 * account's enrolled grade when both are grades of the same course.
 */
export async function resolveEnrolledPaymentIdentity(args: {
  course_id: string;
  is_variant: 0 | 1;
  auth_token: string;
  user_id: number | string;
}): Promise<{ course_id: string; is_variant: 0 | 1 }> {
  const posted = { course_id: args.course_id, is_variant: args.is_variant };
  if (args.is_variant !== 1 || !args.auth_token || !args.user_id) {
    return posted;
  }

  const courses = await fetchAllCoursesRaw();
  const parent = courses.find(
    (course) =>
      parseHasVariants(course.has_variants) === 1 &&
      (course.variants ?? []).some(
        (variant) => String(variant.main_course_id) === args.course_id,
      ),
  );
  if (!parent?.variants?.length) return posted;

  const enrolledGrade = await resolveEnrolledCheckoutGrade(
    parent.variants,
    args,
  );
  return enrolledGrade
    ? { course_id: String(enrolledGrade.main_course_id), is_variant: 1 }
    : posted;
}
