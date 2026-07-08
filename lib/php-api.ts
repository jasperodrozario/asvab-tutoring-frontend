import type {
  CourseData,
  FreePracticeTestResponse,
} from "@/lib/course-types";
import { isFreeTestReady } from "@/lib/course-types";
import type { FreePredTestResponse } from "@/lib/prediction-test-types";
import { isFreePredTestReady } from "@/lib/prediction-test-types";
import type {
  PackageDetailsData,
  PackagesByService,
} from "@/lib/package-types";
import type { ServiceType } from "@/types/Services";
import {
  convertCourseCodeToId,
  convertServiceTypeToSubmenu,
  type PricingSubmenu,
} from "@/lib/package-utils";
import {
  assessCourseReadiness,
  DEFAULT_PUBLISH_REQUIREMENTS,
  type CourseReadinessRequirements,
  type CourseReadinessResult,
} from "@/lib/course-readiness";
import { unstable_cache } from "next/cache";

export const PHP_API_REVALIDATE_SECONDS = 3600;

type PhpApiSuccess<T> = {
  isSuccess?: boolean;
  status?: number;
  message?: string;
  data?: T;
  total_pages?: number | string;
};

export type ContentBlock = {
  id: number | string;
  title: string;
  description: string;
};

export type PolicyDocument = {
  id: string;
  title: string;
  description: string;
};

export type TutorProfile = {
  id: string;
  photo: string;
  name: string | null;
  designation: string | null;
  about: string | null;
};

export type FaqItem = {
  id: string;
  question: string;
  answers: string;
};

export type ServiceDetail = {
  service_id: string;
  title: string;
  is_online: string;
  course_name: string;
  course_id: string;
  ord: string;
  description: string;
  service_type: string;
};

export type PricingPackageItem = {
  course_id: string;
  course_code: string;
  name: string;
  image_src: string;
  price_range: string;
  full_form: string;
};

export type PricingPageItem = {
  pricing_id: string;
  title: string;
  description: string;
  closing_content: string;
};

export type PackageDetailsResponse = {
  isSuccess?: boolean;
  data?: unknown[];
  related_courses?: unknown[];
};

export type BlogPost = {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  written_by: string;
  writer_img: string;
  created_at: string;
};

export type BlogListResult = {
  blogs: BlogPost[];
  totalPages: number;
};

export type CourseOverviewVideo = {
  course_id: string;
  mobile_youtube_link: string;
  desktop_youtube_link: string;
  thumbnail: string;
};

export type NavCourse = {
  course_id: string;
  course_code: string;
  name: string;
  full_form?: string;
  details?: string;
  image_src?: string;
};

export type FreePracticeTestCourse = {
  courseCode: string;
  courseName: string;
  fullForm?: string;
  imageSrc?: string;
  sectionCount: number;
  sectionNames: string[];
};

export type FreePredTestCourse = FreePracticeTestCourse;

export type CourseAssessmentBundle = {
  readiness: CourseReadinessResult;
  details: CourseData | null;
  packagesByService: PackagesByService;
  freePracticeTest: FreePracticeTestResponse | null;
  freePredictionTest: FreePredTestResponse | null;
};

function normalizeCourseCode(courseCode: string): string {
  return courseCode.replace(/-tutor$/, "").toLowerCase();
}

function getPhpApiUrl(): string | undefined {
  return process.env.PHP_API_URL || process.env.NEXT_PUBLIC_PHP_API_URL;
}

async function postPhpApi<T>(
  action: string,
  params: Record<string, string> = {},
): Promise<T | null> {
  const apiUrl = getPhpApiUrl();
  if (!apiUrl) {
    console.error(`PHP API: URL not configured for action "${action}"`);
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action, ...params }),
      next: { revalidate: PHP_API_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(`PHP API "${action}": returned ${response.status}`);
      return null;
    }

    const text = await response.text();

    try {
      return JSON.parse(text) as T;
    } catch {
      console.error(`PHP API "${action}": response was not valid JSON`);
      return null;
    }
  } catch (error) {
    console.error(`PHP API "${action}": fetch failed`, error);
    return null;
  }
}

export async function fetchAboutUsItems(): Promise<ContentBlock[]> {
  const result =
    await postPhpApi<PhpApiSuccess<ContentBlock[]>>("get-about-us");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchHowItWorksItems(): Promise<ContentBlock[]> {
  const result =
    await postPhpApi<PhpApiSuccess<ContentBlock[]>>("get-how-it-works");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchTutorList(): Promise<TutorProfile[]> {
  const result =
    await postPhpApi<PhpApiSuccess<TutorProfile[]>>("get-tutor-list");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchPrivacyPolicy(): Promise<PolicyDocument | null> {
  const result =
    await postPhpApi<PhpApiSuccess<PolicyDocument[]>>("get-privacy-policy");

  if (
    result?.isSuccess &&
    Array.isArray(result.data) &&
    result.data.length > 0
  ) {
    return result.data[0];
  }

  return null;
}

export async function fetchTermsOfService(): Promise<PolicyDocument | null> {
  const result = await postPhpApi<PhpApiSuccess<PolicyDocument[]>>(
    "get-terms-conditions",
  );

  if (
    result?.isSuccess &&
    Array.isArray(result.data) &&
    result.data.length > 0
  ) {
    return result.data[0];
  }

  return null;
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  const result = await postPhpApi<PhpApiSuccess<FaqItem[]>>("get-faq");

  if (result?.status === 200 && Array.isArray(result.data)) {
    return result.data;
  }

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

function normalizeCourseDetail(
  data: Record<string, unknown> | null,
): CourseData | null {
  if (!data || data.status !== 200) {
    return null;
  }

  return data as unknown as CourseData;
}

function getCourseIdFromCode(courseCode: string): string {
  switch (courseCode) {
    case "asvab":
      return "27";
    case "astb":
      return "26";
    case "sift":
      return "25";
    case "afoqt":
      return "24";
    case "oar":
      return "21";
    case "hesi-a2":
      return "20";
    case "ati-teas":
      return "33";
    case "cna":
      return "34";
    default:
      return "";
  }
}

export async function fetchCourseDetailsByCode(
  courseCode: string,
): Promise<CourseData | null> {
  const result = await postPhpApi<Record<string, unknown>>(
    "get-course-details-by-code",
    { course_code: normalizeCourseCode(courseCode) },
  );

  return normalizeCourseDetail(result);
}

export async function fetchFreePracticeTestByCode(
  courseCode: string,
): Promise<FreePracticeTestResponse | null> {
  const result = await postPhpApi<FreePracticeTestResponse>(
    "get-free-practice-test-by-code",
    { course_code: normalizeCourseCode(courseCode) },
  );

  if (!result || result.status !== 200 || !result.isSuccess || !result.data) {
    return null;
  }

  return result;
}

export async function fetchCourseOverviewVideoByCode(
  courseCode: string,
): Promise<CourseOverviewVideo | null> {
  const normalizedCode = normalizeCourseCode(courseCode);
  const courseId = getCourseIdFromCode(normalizedCode);
  const result = await postPhpApi<PhpApiSuccess<CourseOverviewVideo>>(
    "get-course-overview-video",
    {
      course_id: courseId,
    },
  );

  if (result?.isSuccess && result.data) {
    return result.data;
  }

  return null;
}

export async function fetchServiceDetail(
  serviceId: string,
): Promise<ServiceDetail | null> {
  const result = await postPhpApi<PhpApiSuccess<ServiceDetail>>(
    "get-specific-service-detail",
    { service_id: serviceId },
  );

  if (result?.isSuccess && result.data) {
    return result.data;
  }

  return null;
}

export async function fetchPricingPackages(
  submenu: PricingSubmenu,
): Promise<PricingPackageItem[]> {
  const result = await postPhpApi<PhpApiSuccess<PricingPackageItem[]>>(
    "specific-course-list-tutoring-package",
    { submenu },
  );

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchPricingPageContent(
  submenu: PricingSubmenu,
): Promise<PricingPageItem[]> {
  const result = await postPhpApi<PhpApiSuccess<PricingPageItem[]>>(
    "specific-get-pricing-page-content",
    { submenu },
  );

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchPackageDetails(
  serviceType: string,
  courseCode: string,
): Promise<PackageDetailsResponse | null> {
  const result = await postPhpApi<PackageDetailsResponse>(
    "specific-tutoring-package-details-page",
    {
      course_id: convertCourseCodeToId(courseCode),
      submenu: convertServiceTypeToSubmenu(serviceType),
    },
  );

  return result ?? null;
}

const ALL_SERVICE_TYPES: ServiceType[] = [
  "1-on-1-tutoring",
  "group-tutoring",
  "self-study",
];

export async function fetchAllPackageDetailsForCourse(
  courseCode: string,
): Promise<PackagesByService> {
  const entries = await Promise.all(
    ALL_SERVICE_TYPES.map(
      async (serviceType) =>
        [
          serviceType,
          (await fetchPackageDetails(
            serviceType,
            courseCode,
          )) as PackageDetailsData | null,
        ] as const,
    ),
  );

  return Object.fromEntries(entries) as PackagesByService;
}

export async function fetchBlogList(pageNo = 1): Promise<BlogListResult> {
  const result = await postPhpApi<PhpApiSuccess<BlogPost[]>>("get-blogs", {
    page_no: String(pageNo),
  });

  if (result?.isSuccess && Array.isArray(result.data)) {
    return {
      blogs: result.data,
      totalPages: Number(result.total_pages) || 1,
    };
  }

  return { blogs: [], totalPages: 1 };
}

export async function fetchBlogDetails(
  blogId: string,
): Promise<BlogPost | null> {
  const result = await postPhpApi<PhpApiSuccess<BlogPost>>("get-blog-details", {
    blog_id: blogId,
  });

  if (result?.isSuccess && result.data) {
    return result.data;
  }

  return null;
}

async function loadCourseAssessmentBundle(
  courseCode: string,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<CourseAssessmentBundle> {
  const normalizedCode = normalizeCourseCode(courseCode);

  const [details, packagesByService, freePracticeTest, freePredictionTest] =
    await Promise.all([
      requirements.details
        ? fetchCourseDetailsByCode(normalizedCode)
        : Promise.resolve(null),
      requirements.packages
        ? fetchAllPackageDetailsForCourse(normalizedCode)
        : Promise.resolve({} as PackagesByService),
      requirements.freePracticeTest
        ? fetchFreePracticeTestByCode(normalizedCode)
        : Promise.resolve(null),
      requirements.freePredictionTest
        ? fetchFreePredTestByCode(normalizedCode)
        : Promise.resolve(null),
    ]);

  const readiness = assessCourseReadiness(
    {
      courseCode: normalizedCode,
      details,
      packagesByService,
      freePracticeTest,
      freePredictionTest,
    },
    requirements,
  );

  return {
    readiness,
    details,
    packagesByService,
    freePracticeTest,
    freePredictionTest,
  };
}

function getCachedCourseAssessmentBundle(
  courseCode: string,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<CourseAssessmentBundle> {
  const normalizedCode = normalizeCourseCode(courseCode);
  const requirementsKey = JSON.stringify(requirements);

  return unstable_cache(
    () => loadCourseAssessmentBundle(normalizedCode, requirements),
    ["course-assessment-bundle", normalizedCode, requirementsKey],
    { revalidate: PHP_API_REVALIDATE_SECONDS },
  )();
}

export async function assessCoursePublishability(
  courseCode: string,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<CourseReadinessResult> {
  const bundle = await getCachedCourseAssessmentBundle(courseCode, requirements);
  return bundle.readiness;
}

export async function isCoursePublishable(
  courseCode: string,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<boolean> {
  const { publishable } = await assessCoursePublishability(
    courseCode,
    requirements,
  );
  return publishable;
}

async function fetchAllCoursesRaw(): Promise<NavCourse[]> {
  const result = await postPhpApi<PhpApiSuccess<NavCourse[]>>("get-all-courses");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchPublishableCourses(
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<NavCourse[]> {
  const courses = await fetchAllCoursesRaw();

  const results = await Promise.all(
    courses.map(async (course) => {
      const { publishable } = await assessCoursePublishability(
        course.course_code,
        requirements,
      );
      return publishable ? course : null;
    }),
  );

  return results.filter((course): course is NavCourse => course !== null);
}

export async function fetchAllCourses(): Promise<NavCourse[]> {
  return fetchPublishableCourses();
}

export async function fetchAllCourseCodes(): Promise<string[]> {
  const courses = await fetchAllCourses();
  return courses.map((course) => course.course_code);
}

export async function fetchPublishablePricingPackages(
  submenu: PricingSubmenu,
  requirements: CourseReadinessRequirements = DEFAULT_PUBLISH_REQUIREMENTS,
): Promise<PricingPackageItem[]> {
  const packages = await fetchPricingPackages(submenu);

  const results = await Promise.all(
    packages.map(async (pkg) => {
      const publishable = await isCoursePublishable(pkg.course_code, requirements);
      return publishable ? pkg : null;
    }),
  );

  return results.filter((pkg): pkg is PricingPackageItem => pkg !== null);
}

export async function fetchFreePracticeTestCatalog(): Promise<
  FreePracticeTestCourse[]
> {
  const courses = await fetchPublishableCourses();

  const entries = await Promise.all(
    courses.map(async (course) => {
      const bundle = await getCachedCourseAssessmentBundle(course.course_code);
      const freeTest = bundle.freePracticeTest;
      const ft_cat_list = freeTest?.data?.categories;
      const ft_ques_list = freeTest?.data?.questions;

      if (!isFreeTestReady(ft_cat_list, ft_ques_list) || !ft_cat_list) {
        return null;
      }

      const entry: FreePracticeTestCourse = {
        courseCode: course.course_code,
        courseName: freeTest?.course_name || course.name,
        fullForm: course.full_form || freeTest?.full_form,
        imageSrc: course.image_src,
        sectionCount: ft_cat_list.length,
        sectionNames: ft_cat_list.map((category) => category.name),
      };

      return entry;
    }),
  );

  return entries.filter((entry): entry is FreePracticeTestCourse => entry !== null);
}

export async function fetchFreePredTestByCode(
  courseCode: string,
): Promise<FreePredTestResponse | null> {
  const normalizedCode = normalizeCourseCode(courseCode);

  const result = await postPhpApi<FreePredTestResponse>(
    "get-free-pred-test-by-code",
    { course_code: normalizedCode },
  );

  if (!result || result.status !== 200 || !result.isSuccess || !result.data) {
    return null;
  }

  result.prediction_test_name = result.course_name ?? "";

  if (normalizedCode === "asvab") {
    result.prediction_test_name = `${result.course_name}/AFQT`;
  }

  return result;
}

export async function fetchFreePredTestCatalog(): Promise<FreePredTestCourse[]> {
  const courses = await fetchPublishableCourses();

  const entries = await Promise.all(
    courses.map(async (course) => {
      const bundle = await getCachedCourseAssessmentBundle(course.course_code);
      const predTest = bundle.freePredictionTest;
      const categories = predTest?.data?.categories;
      const questions = predTest?.data?.questions;

      if (!isFreePredTestReady(categories, questions) || !categories) {
        return null;
      }

      const entry: FreePredTestCourse = {
        courseCode: course.course_code,
        courseName:
          predTest?.prediction_test_name ||
          predTest?.course_name ||
          course.name,
        fullForm: course.full_form || predTest?.full_form,
        imageSrc: course.image_src,
        sectionCount: categories.length,
        sectionNames: categories.map((category) => category.name),
      };

      return entry;
    }),
  );

  return entries.filter((entry): entry is FreePredTestCourse => entry !== null);
}

