"use client";

import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Carousel } from "react-bootstrap";

interface WebUserFeedback {
  feedback_id: string;
  user_id: string;
  user_name: string;
  email: string;
  course_name: string;
  rating: string;
  feedback: string;
  created_at: string;
}

interface ReviewItem {
  id: string;
  name: string;
  profile: string;
  text: string;
}

const DEFAULT_PROFILE = "/images/default_profile.jpeg";

const Review = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      const formData = new FormData();
      formData.append("action", "get-web-user-feedback");

      try {
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (
          (data?.status === 200 || data?.isSuccess) &&
          Array.isArray(data.data)
        ) {
          setReviews(
            data.data.map((item: WebUserFeedback) => ({
              id: item.feedback_id,
              name: item.user_name?.trim() || "Student",
              profile: DEFAULT_PROFILE,
              text: item.feedback?.trim() || "",
            })),
          );
        } else {
          console.error("Failed to load reviews:", data?.message);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  return (
    <section className="testimonial-section text-center my-5 py-5">
      <div className="container" style={{ maxWidth: "800px" }}>
        <h2 className="display-5 fw-bold text-gray-800 d-inline-block pb-3 position-relative">
          Students Reviews
          <img
            src="/images/border_v1.png"
            alt="underline"
            width={160}
            height={8}
            className="position-absolute bottom-0 start-50 translate-middle-x"
            style={{ objectFit: "cover" }}
          />
        </h2>

        {loading && <p className="text-muted mt-4">Loading reviews...</p>}

        {!loading && reviews.length === 0 && (
          <p className="text-muted mt-4">No reviews available yet.</p>
        )}

        {!loading && reviews.length > 0 && (
          <>
            <Carousel
              activeIndex={index}
              onSelect={handleSelect}
              interval={4000}
              pause={false}
              slide
              controls={false}
              indicators={false}
              className="smooth-carousel"
            >
              {reviews.map((review) => (
                <Carousel.Item key={review.id}>
                  <div className="p-4 px-md-5">
                    <i className="bi bi-quote fs-1 primary-color-custom"></i>
                    <p className="testimonial-text mt-3">{review.text}</p>
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                      <img
                        src={review.profile}
                        alt={review.name}
                        width={50}
                        height={50}
                        className="rounded-circle"
                      />
                      <span className="fw-semibold">{review.name}</span>
                    </div>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>

            <div className="d-flex justify-content-center gap-2 mt-3">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`rounded-circle border-0 ${
                    idx === index
                      ? "bg-custom-primary"
                      : "bg-secondary opacity-50"
                  }`}
                  style={{ width: "12px", height: "12px", cursor: "pointer" }}
                  onClick={() => handleSelect(idx)}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-4">
          <a
            href="https://www.facebook.com/asvabtutoring/reviews"
            className="btn btn-primary-custom"
          >
            View All Reviews
          </a>
        </div>
      </div>

      <style jsx global>{`
        .smooth-carousel .carousel-item {
          transition: transform 1s ease-in-out;
        }

        @media (max-width: 768px) {
          .testimonial-text {
            font-size: 0.95rem;
          }
        }

        .testimonial-text {
          font-style: italic;
          line-height: 1.6;
        }

        .smooth-carousel .carousel-inner {
          direction: rtl;
        }

        .smooth-carousel .carousel-item > div {
          direction: ltr;
        }
      `}</style>
    </section>
  );
};

export default Review;
