'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type TutorPackage = {
  id: string;
  name: string;
  description: string;
  course_id: string;
  price: string;
  sessions: string;
  free_sessions: string;
  cover_image: string;
  payment_methode: string;
  is_one_to_one: string;
  is_group_tutoring: string;
  is_web_subcription: string;
};

const Packages = () => {
  const [packages, setPackages] = useState<TutorPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const formData = new FormData();
        formData.append('action', 'get-tutor-packages');

        const res = await fetch(
          'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
          { method: 'POST', body: formData }
        );

        const data = await res.json();
        if (data?.isSuccess) {
          setPackages(data.data);
        }
      } catch (error) {
        console.error('Error fetching tutor packages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
    <section className="bg-white py-5 text-center">
      <div className="container">
        {/* Title */}
        <div className="text-center mb-5 position-relative">
          <h2 className="display-5 fw-bold text-gray-800 d-inline-block pb-3 position-relative">
            Our Packages
            <Image
              src="/images/border_v1.png"
              alt="underline"
              width={160}
              height={8}
              className="position-absolute start-50 translate-middle-x bottom-0"
              style={{ objectFit: 'cover' }}
            />
          </h2>
        </div>

        {/* Description */}
        <p className="text-secondary text-start mx-auto mb-4" style={{ maxWidth: '960px' }}>
          ASVAB Tutoring will provide One-on-One online tutoring service. All the study materials with a lesson plan
          will be provided. Each session is 2 hours. The tutoring services offered by ASVAB Tutoring are as follows.
        </p>

        {/* Subheading */}
        <h3 className="fw-semibold fs-5 mb-4 text-start" style={{ maxWidth: '960px', marginInline: 'auto' }}>
          Select online Tutoring package:
        </h3>

        {/* Packages Grid */}
        <div className="row justify-content-center g-4 mb-5">
          {loading ? (
            <p>Loading packages...</p>
          ) : (
            packages.map((pkg) => (
              <div key={pkg.id} className="col-12 col-sm-6 col-md-4 col-lg-4 hover-lift">
                <div className="card h-100 shadow-sm">
                  <Image
                    src={`https://test-prep.asvab-tutoring.com/${pkg.cover_image}`}
                    alt={pkg.name}
                    width={500}
                    height={300}
                    className="card-img-top"
                    style={{ height: 'auto', objectFit: 'cover' }}
                  />
                  <div className="card-body text-start">
                    <h5 className="card-title fw-bold text-primary">{pkg.name}</h5>
                    <p className="card-text text-secondary fw-semibold">${pkg.price}</p>
                    <p className="small text-muted">{pkg.description}</p>
                    <p className="small">
                      Sessions: {pkg.sessions} | Free: {pkg.free_sessions}
                    </p>
                    <div className="text-center">
                      <a href="#" className="btn btn-secondary-custom btn-sm w-50">
                        Details
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes */}
        <p className="text-muted fs-6 text-start mx-auto mb-3" style={{ maxWidth: '960px' }}>
          <span className="fw-semibold text-danger">NOTE:</span> No session will be scheduled without payment
          information on file. Students are required to submit homework before each session.
        </p>
        <p className="text-muted fs-6 text-start mx-auto mb-5" style={{ maxWidth: '960px' }}>
          <span className="fw-semibold text-primary">Cancellation Policy:</span> If you want to cancel a session or
          reschedule, 24 hrs. advance notice is required. You can cancel the entire service within 7 days.
        </p>

        {/* Enroll Button */}
        <a href="/tutors" className="btn btn-primary-custom fw-semibold text-white px-4 py-2 mb-4">
          ENROLL NOW
        </a>
      </div>
    </section>
  );
};

export default Packages;
