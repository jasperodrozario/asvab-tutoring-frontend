"use client";

import { useEffect, useState } from "react";
import CourseReviews from "@/components/course/CourseReviews";
import type { UserFeedback } from "@/lib/course-types";
import { selectHomepageReviews, HOMEPAGE_REVIEW_LIMIT } from "@/lib/homepage-reviews";

type ReviewProps = {
  reviews: UserFeedback[];
};

export default function Review({ reviews }: ReviewProps) {
  const [visibleReviews, setVisibleReviews] = useState<UserFeedback[] | null>(
    null,
  );

  useEffect(() => {
    setVisibleReviews(selectHomepageReviews(reviews));
  }, [reviews]);

  if (!visibleReviews?.length) return null;

  return (
    <CourseReviews
      reviews={visibleReviews}
      showCourseName
      maxReviews={HOMEPAGE_REVIEW_LIMIT}
    />
  );
}
