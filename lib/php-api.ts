import type {
  CourseData,
  FreePracticeTestResponse,
} from "@/lib/course-types";
import { isFreeTestReady } from "@/lib/course-types";
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

  const onlineFreeTest = data.online_free_test_data as
    | { categories?: string[]; questions?: CourseData["ft_ques_list"] }
    | undefined;

  return {
    ...(data as unknown as CourseData),
    ft_cat_list: onlineFreeTest?.categories || [],
    ft_ques_list: onlineFreeTest?.questions || {},
  };
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
    default:
      return "";
  }
}

export async function fetchCourseDetailsByCode(
  courseCode: string,
): Promise<CourseData | null> {
  const result = await postPhpApi<Record<string, unknown>>(
    "get-course-details-by-code",
    { course_code: courseCode.replace(/-tutor$/, "").toLowerCase() },
  );

  return normalizeCourseDetail(result);
}

export async function fetchFreePracticeTestByCode(
  courseCode: string,
): Promise<FreePracticeTestResponse | null> {
  const result = await postPhpApi<FreePracticeTestResponse>(
    "get-free-practice-test-by-code",
    { course_code: courseCode.replace(/-tutor$/, "").toLowerCase() },
  );

  if (!result || result.status !== 200 || !result.isSuccess || !result.data) {
    return null;
  }

  return result;
}

export async function fetchCourseOverviewVideoByCode(
  courseCode: string,
): Promise<CourseOverviewVideo | null> {
  const normalizedCode = courseCode.replace(/-tutor$/, "").toLowerCase();
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

export async function fetchAllCourses(): Promise<NavCourse[]> {
  const result = await postPhpApi<PhpApiSuccess<NavCourse[]>>("get-all-courses");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchFreePracticeTestCatalog(): Promise<
  FreePracticeTestCourse[]
> {
  const courses = await fetchAllCourses();

  const entries = await Promise.all(
    courses.map(async (course) => {
      const freeTest = await fetchFreePracticeTestByCode(course.course_code);
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
        sectionNames: ft_cat_list,
      };

      return entry;
    }),
  );

  return entries.filter((entry): entry is FreePracticeTestCourse => entry !== null);
}
