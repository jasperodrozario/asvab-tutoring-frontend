import type { Session } from "@/components/tabs/LessonPlanTab";
import type { VideoObject } from "@/components/tabs/CourseVideoTab";
import type { Question } from "@/components/free-test/FreeTest";

export interface RelatedCourse {
  course_id: string;
  course_code: string;
  full_form: string;
  subscribe_button_url?: string;
  image?: string;
  name: string;
  details?: string;
}

export interface CourseData {
  status: number;
  isSuccess: boolean;
  message: string;
  course_name?: string;
  full_form: string;
  course_header?: string;
  course_tagline?: string;
  overview?: string;
  curriculum?: string;
  sessions?: Session[];
  picture?: string;
  video?: VideoObject;
  ft_cat_list?: string[];
  ft_ques_list?: { [key: string]: Question[] };
  related_courses?: RelatedCourse[];
  total_ques?: number;
  image_src?: string;
}

export interface CourseOverviewVideo {
  c_id: string;
  course_id: string;
  mobile_youtube_link: string;
  desktop_youtube_link: string;
  thumbnail: string;
}

export function hasFreeTestQuestions(
  ft_cat_list?: string[],
  ft_ques_list?: { [key: string]: Question[] },
): boolean {
  if (!ft_cat_list?.length || !ft_ques_list) return false;
  return ft_cat_list.some((cat) => {
    const questions = ft_ques_list[cat];
    return Array.isArray(questions) && questions.length > 0;
  });
}
