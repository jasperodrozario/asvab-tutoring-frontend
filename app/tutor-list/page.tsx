'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Tutor {
  id: string;
  photo: string;
  name: string | null;
  designation: string | null;
  about: string | null;
}

export default function TutorsListPage() {
  const [teachers, setTeachers] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      const formData = new FormData();
      formData.append('action', 'get-tutor-list');

      try {
        const res = await fetch(
          'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
          { method: 'POST', body: formData }
        );

        const data = await res.json();

        if (data?.isSuccess) {
          setTeachers(data.data);
        } else {
          console.error('Failed to load tutors:', data?.message);
        }
      } catch (err) {
        console.error('Error fetching tutors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return (
    <section className="bg-white text-dark">
      {/* Banner */}
      <div className="banner mb-5">
        <h1 className="text-white text-center bg-black bg-opacity-50 py-3 px-4 rounded">
          Our Tutors
        </h1>
      </div>

      {/* Title with bottom border */}
      <div className="text-center mb-5 position-relative">
        <h2 className="fw-bold display-5 d-inline-block pb-3 position-relative">
          Meet Our Teachers
          <img
            src="/images/border_v1.png"
            alt="underline"
            width={160}
            height={8}
            className="position-absolute start-50 translate-middle-x bottom-0"
            style={{ objectFit: 'cover' }}
          />
        </h2>
      </div>

      {/* Tutors list */}
      <div className="container py-5">
        {loading ? (
          <p className="text-center">Loading tutors...</p>
        ) : (
          <div className="row g-4">
            {teachers.map((teacher) => (
              <div className="col-md-6 col-lg-6" key={teacher.id}>
                <div className="card h-100 shadow-sm text-center">
                  <div className="pt-4">
                    <Image
                      src={teacher.photo}
                      alt={teacher.name || 'Tutor'}
                      width={220}
                      height={277}
                      style={{ objectFit: 'contain' }}
                      unoptimized={true}
                    />
                  </div>
                  <div className="card-body d-flex flex-column text-start px-4">
                    <h5 className="card-title text-center fw-semibold mt-3">
                      {teacher.name || 'No Name'}
                    </h5>
                    <p className="text-center text-primary small mb-3 fw-medium">
                      {teacher.designation || 'Tutor'}
                    </p>

                    {/* ✅ Render HTML safely */}
                    <p
                      className="card-text small  "
                      dangerouslySetInnerHTML={{
                        __html: teacher.about || 'No bio available.',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
