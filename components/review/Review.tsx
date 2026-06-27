'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Carousel } from 'react-bootstrap';

interface ReviewItem {
  id: number;
  name: string;
  profile: string;
  text: string;
}

const Review = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);

  const reviewsData: ReviewItem[] = [
    {
      id: 1,
      name: 'Jahmiah Jester Watson',
      profile: '/images/default_profile.jpeg',
      text: 'The practice tests and flashcards were incredibly helpful in preparing me for the ASVAB. Dalia is an excellent tutor who really helped me improve my arithmetic and math knowledge!'
    },
    {
      id: 2,
      name: 'Eunice Alberson',
      profile: '/images/default_profile.jpeg',
      text: 'I highly recommend this company. They were flexible and able to get our four sessions in under a week. The results were amazing. Worth every penny. Thank you.'
    },
    {
      id: 3,
      name: 'Jake Lin',
      profile: '/images/default_profile.jpeg',
      text: 'ASVAB tutoring really helped me 3x my score on the ASVAB. All thanks to ASVAB tutoring and my tutor Sudeshna Das, she really helped me understand a lot about the ASVAB.'
    },
    {
      id: 4,
      name: 'Roberto Lira',
      profile: '/images/default_profile.jpeg',
      text: 'Personally, it was a great help from the tutors who help each of us and motivate us to take the ASVAB and have a good score. Highly recommend them!'
    },
    {
      id: 5,
      name: 'Charlie Eckhardt',
      profile: '/images/default_profile.jpeg',
      text: 'I scored a 50 on my OAR!!'
    }
  ];

  useEffect(() => {
    setReviews(reviewsData);
  }, []);

  const handleSelect = (selectedIndex: number) => {
    setIndex(selectedIndex);
  };

  return (
    <section className="testimonial-section text-center py-5">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h2 className="display-5 fw-bold text-gray-800 d-inline-block pb-3 position-relative">
          Students Reviews
          <img
            src="/images/border_v1.png"
            alt="underline"
            width={160}
            height={8}
            className="position-absolute bottom-0 start-50 translate-middle-x"
            style={{ objectFit: 'cover' }}
          />
        </h2>

        <Carousel
          activeIndex={index}
          onSelect={handleSelect}
          interval={4000}
          pause={false}
          slide
          controls={false}
          indicators={false}
          className="mt-5 smooth-carousel"
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
              className={`rounded-circle border-0 ${idx === index ? 'bg-custom-primary' : 'bg-secondary opacity-50'
                }`}
              style={{ width: '12px', height: '12px', cursor: 'pointer' }}
              onClick={() => handleSelect(idx)}
            />
          ))}
        </div>


        <div className="mt-4">
          <a href="https://www.facebook.com/asvabtutoring/reviews" className="btn btn-primary-custom">
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
