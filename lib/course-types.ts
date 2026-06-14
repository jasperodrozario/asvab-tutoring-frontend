import type { Session } from "@/components/tabs/LessonPlanTab";
import type { VideoObject } from "@/components/tabs/CourseVideoTab";
import type { Question } from "@/components/tabs/FreeTestTab";

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
