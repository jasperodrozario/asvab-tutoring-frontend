import type { CourseData, FreePracticeTestResponse } from "@/lib/course-types";
import { isFreeTestReady } from "@/lib/course-types";
import type { FreePredTestResponse } from "@/lib/prediction-test-types";
import { isFreePredTestReady } from "@/lib/prediction-test-types";
import type { PackagesByService } from "@/lib/package-types";
import type { ServiceType } from "@/types/Services";
import { convertCourseCodeToId } from "@/lib/package-utils";

const ALL_SERVICE_TYPES: ServiceType[] = [
  "1-on-1-tutoring",
  "group-tutoring",
  "self-study",
];

export type CourseReadinessRequirements = {
  details: boolean;
  packages: boolean;
  freePracticeTest: boolean;
  freePredictionTest: boolean;
  mappedCourseId: boolean;
};

export const DEFAULT_PUBLISH_REQUIREMENTS: CourseReadinessRequirements = {
  details: true,
  packages: true,
  freePracticeTest: true,
  freePredictionTest: true,
  mappedCourseId: true,
};

export type CourseReadinessInput = {
  courseCode: string;
  details?: CourseData | null;
  packagesByService?: PackagesByService;
  freePracticeTest?: FreePracticeTestResponse | null;
  freePredictionTest?: FreePredTestResponse | null;
};

export type CourseReadinessResult = {
  publishable: boolean;
  missing: string[];
};

export function hasNonEmptyText(value?: string | null): boolean {
  return typeof value === "string" && value.trim() !== "";
}

export function hasCourseDetails(details?: CourseData | null): boolean {
  if (!details) return false;
  if (!hasNonEmptyText(details.full_form)) return false;
  if (!hasNonEmptyText(details.overview)) return false;
  if (!hasNonEmptyText(details.image_src)) return false;
  return (
    hasNonEmptyText(details.course_header) || hasNonEmptyText(details.course_name)
  );
}

export function hasPackagesForService(
  packagesByService: PackagesByService | undefined,
  serviceType: ServiceType,
): boolean {
  if (!packagesByService) return false;

  const servicePackages = packagesByService[serviceType]?.data;
  if (!Array.isArray(servicePackages) || servicePackages.length === 0) {
    return false;
  }

  return servicePackages.some(
    (pkg) => Array.isArray(pkg.sessions) && pkg.sessions.length > 0,
  );
}

export function hasPackages(packagesByService?: PackagesByService): boolean {
  if (!packagesByService) return false;

  return ALL_SERVICE_TYPES.some((serviceType) =>
    hasPackagesForService(packagesByService, serviceType),
  );
}

export function hasMappedCourseId(courseCode: string): boolean {
  const normalized = courseCode.replace(/-tutor$/, "").toLowerCase();
  const mappedId = convertCourseCodeToId(normalized);
  return mappedId !== normalized;
}

export function hasFreePracticeTestReady(
  response?: FreePracticeTestResponse | null,
): boolean {
  return isFreeTestReady(
    response?.data?.categories,
    response?.data?.questions,
  );
}

export function hasFreePredictionTestReady(
  response?: FreePredTestResponse | null,
): boolean {
  return isFreePredTestReady(
    response?.data?.categories,
    response?.data?.questions,
  );
}

export function assessCourseReadiness(
  input: CourseReadinessInput,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): CourseReadinessResult {
  const missing: string[] = [];

  if (requirements.details && !hasCourseDetails(input.details)) {
    if (!input.details) {
      missing.push("course_details");
    } else {
      if (!hasNonEmptyText(input.details.full_form)) missing.push("full_form");
      if (!hasNonEmptyText(input.details.overview)) missing.push("overview");
      if (!hasNonEmptyText(input.details.image_src)) missing.push("image_src");
      if (
        !hasNonEmptyText(input.details.course_header) &&
        !hasNonEmptyText(input.details.course_name)
      ) {
        missing.push("course_title");
      }
    }
  }

  if (requirements.packages && !hasPackages(input.packagesByService)) {
    missing.push("packages");
  }

  if (
    requirements.freePracticeTest &&
    !hasFreePracticeTestReady(input.freePracticeTest)
  ) {
    missing.push("free_practice_test");
  }

  if (
    requirements.freePredictionTest &&
    !hasFreePredictionTestReady(input.freePredictionTest)
  ) {
    missing.push("free_prediction_test");
  }

  if (requirements.mappedCourseId && !hasMappedCourseId(input.courseCode)) {
    missing.push("mapped_course_id");
  }

  return {
    publishable: missing.length === 0,
    missing,
  };
}
