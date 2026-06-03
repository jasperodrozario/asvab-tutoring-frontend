export const PHP_API_REVALIDATE_SECONDS = 3600;

type PhpApiSuccess<T> = {
  isSuccess?: boolean;
  status?: number;
  message?: string;
  data?: T;
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
  const result = await postPhpApi<PhpApiSuccess<ContentBlock[]>>("get-about-us");

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
  const result = await postPhpApi<PhpApiSuccess<TutorProfile[]>>("get-tutor-list");

  if (result?.isSuccess && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function fetchPrivacyPolicy(): Promise<PolicyDocument | null> {
  const result =
    await postPhpApi<PhpApiSuccess<PolicyDocument[]>>("get-privacy-policy");

  if (result?.isSuccess && Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0];
  }

  return null;
}

export async function fetchTermsOfService(): Promise<PolicyDocument | null> {
  const result =
    await postPhpApi<PhpApiSuccess<PolicyDocument[]>>("get-terms-conditions");

  if (result?.isSuccess && Array.isArray(result.data) && result.data.length > 0) {
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
