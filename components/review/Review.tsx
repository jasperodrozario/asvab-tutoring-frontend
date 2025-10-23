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
      text: 'I highly recommend this company.  They were flexible and able to get our four sessions in under a week.  The results were amazing.  Worth every penny.  Thank you.'
    },
    {
      id: 3,
      name: 'Jake Lin',
      profile: '/images/default_profile.jpeg',
      text: 'ASVAB tutoring really helped me 3x my score on the ASVAB. All thanks to ASVAB tutoring and my tutor Sudeshna Das, she really helped me understand a lot about the ASVAB I’m really glad that I had her as my tutor because thanks to her now I posses knowledge like never before.'
    },
    {
      id: 4,
      name: 'Roberto Lira',
      profile: '/images/default_profile.jpeg',
      text: 'Personally, it was a great help from the tutors who help each of us and motivate us to take the ASVAB and have a good score. I recommend each of the people to take help from them.'
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
          <Image
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
          fade
          interval={4000}
          pause={false}
          className="mt-5"
          indicators={false} // hide default dots
        >
          {reviews.map((review) => (
            <Carousel.Item key={review.id}>
              <div className="p-4 px-md-5">
                <div className="quote-icon quote-close">
                  <i className="bi bi-quote"></i>
                </div>
                <p className="testimonial-text">{review.text}</p>
                <div className="d-flex justify-content-center align-items-center testimonial-author gap-3 mt-4">
                  <Image
                    src={review.profile}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="rounded-circle"
                  />
                  <span className="fw-semibold">{review.name}</span>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Custom Indicators */}
        <div className="d-flex justify-content-center gap-2 mt-3">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`rounded-circle border-0 ${
                idx === index ? 'bg-primary' : 'bg-secondary'
              }`}
              style={{ width: '12px', height: '12px', cursor: 'pointer' }}
              onClick={() => handleSelect(idx)}
            />
          ))}
        </div>

        <div className="mt-4">
          <a
            href="/all-reviews"
            className="btn btn-primary-custom"
          >
            View All Reviews
          </a>
        </div>
      </div>
    </section>
  );
};

export default Review;
