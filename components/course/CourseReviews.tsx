"use client";

import { useState } from "react";
import { Carousel } from "react-bootstrap";
import type { UserFeedback } from "@/lib/course-types";
import styles from "./CourseReviews.module.css";

type CourseReviewsProps = {
  reviews: UserFeedback[];
  courseName?: string;
};

function parseRating(rating: string | number): number {
  const value = typeof rating === "number" ? rating : Number(rating);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function formatReviewDate(value?: string): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className={styles.stars}
      aria-label={`${rating} out of 5 stars`}
      title={`${rating} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating;
        return (
          <i
            key={index}
            className={`bi ${filled ? "bi-star-fill" : "bi-star"} ${styles.star}`}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

export default function CourseReviews({
  reviews,
  courseName,
}: CourseReviewsProps) {
  const [index, setIndex] = useState(0);

  const visibleReviews = reviews.filter(
    (review) => review.feedback?.trim() && review.user_name?.trim(),
  );

  if (!visibleReviews.length) return null;

  const heading = courseName?.trim()
    ? `${courseName.trim()} Student Reviews`
    : "Student Reviews";

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  const goToPrev = () => {
    setIndex(
      (current) =>
        (current - 1 + visibleReviews.length) % visibleReviews.length,
    );
  };

  const goToNext = () => {
    setIndex((current) => (current + 1) % visibleReviews.length);
  };

  const showNav = visibleReviews.length > 1;

  return (
    <section
      className="testimonial-section text-center py-5"
      aria-labelledby="course-reviews-heading"
    >
      <div className={`container ${styles.container}`}>
        <h2
          id="course-reviews-heading"
          className="display-5 fw-bold text-gray-800 d-inline-block pb-3 position-relative"
        >
          {heading}
          <img
            src="/images/border_v1.png"
            alt=""
            width={160}
            height={8}
            className="position-absolute bottom-0 start-50 translate-middle-x"
            style={{ objectFit: "cover" }}
          />
        </h2>

        <div className={`position-relative mt-5 ${styles.sliderWrapper}`}>
          {showNav ? (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navPrev}`}
                aria-label="Previous review"
                onClick={goToPrev}
              >
                <i className="bi bi-chevron-left" aria-hidden />
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navNext}`}
                aria-label="Next review"
                onClick={goToNext}
              >
                <i className="bi bi-chevron-right" aria-hidden />
              </button>
            </>
          ) : null}

          <Carousel
            activeIndex={index}
            onSelect={handleSelect}
            interval={4000}
            pause={false}
            slide
            controls={false}
            indicators={false}
            className={styles.carousel}
          >
            {visibleReviews.map((review) => {
              const rating = parseRating(review.rating);
              const dateLabel = formatReviewDate(review.created_at);
              const name = review.user_name.trim();
              const text = review.feedback.trim();

              return (
                <Carousel.Item key={review.feedback_id}>
                  <div className="p-4 px-md-5">
                    <i
                      className="bi bi-quote fs-1 primary-color-custom"
                      aria-hidden
                    />
                    <StarRating rating={rating} />
                    <p className={`testimonial-text mt-3 ${styles.text}`}>
                      {text}
                    </p>
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                      <div className={styles.avatar} aria-hidden>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.author}>
                        <span className="fw-semibold">{name}</span>
                        {dateLabel ? (
                          <time
                            className={styles.date}
                            dateTime={review.created_at}
                          >
                            {dateLabel}
                          </time>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Carousel.Item>
              );
            })}
          </Carousel>
        </div>

        {showNav ? (
          <div className="d-flex justify-content-center gap-2 mt-3">
            {visibleReviews.map((review, idx) => (
              <button
                key={review.feedback_id}
                type="button"
                aria-label={`Go to review ${idx + 1}`}
                aria-current={idx === index ? "true" : undefined}
                className={`rounded-circle border-0 ${
                  idx === index ? "bg-custom-primary" : "bg-secondary opacity-50"
                }`}
                style={{ width: "12px", height: "12px", cursor: "pointer" }}
                onClick={() => handleSelect(idx)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
