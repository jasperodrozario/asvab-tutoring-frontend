'use client';

import Image from 'next/image';

export default function PackageDetailsTop() {
  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="row align-items-center g-4">
          {/* Left Side: Package Image */}
          <div className="col-lg-6 text-center">
            <Image
              src="/images/sift.jpg" // replace with your API/image path
              alt="SIFT Package"
              width={600}
              height={400}
              className="img-fluid rounded shadow-sm"
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* Right Side: Details */}
          <div className="col-lg-6 text-start">
            {/* Title & Price */}
            <h2 className="fw-bold text-uppercase">SIFT</h2>
            <h4 className="fw-bold text-success mb-3">$85.00 – $960.00</h4>

            {/* Description */}
            <p className="text-muted">
              <strong>ASVAB Tutoring</strong> helps you to fulfill your dreams by ensuring
              that you cover all the important areas to become an Aviation Officer. It
              prepares you for the area of defense you strive for. During the course, you
              can hone your skills and learn different strategies to crack the SIFT Test.
            </p>

            {/* Payment Info */}
            <div className="mt-4">
              <h5 className="fw-bold mb-3">HOW TO SEND PAYMENT</h5>
              <ul className="list-unstyled">
                <li className="d-flex align-items-center mb-2">
                  <Image
                    src="/images/icons/cashapp.png"
                    alt="Cash App"
                    width={30}
                    height={30}
                    className="me-2"
                  />
                  Cash App
                </li>
                <li className="d-flex align-items-center mb-2">
                  <Image
                    src="/images/icons/zelle.png"
                    alt="Zelle"
                    width={30}
                    height={30}
                    className="me-2"
                  />
                  Zelle
                </li>
                <li className="d-flex align-items-center mb-2">
                  <Image
                    src="/images/icons/applepay.png"
                    alt="Apple Pay"
                    width={30}
                    height={30}
                    className="me-2"
                  />
                  Apple Pay
                </li>
                <li className="d-flex align-items-center mb-2">
                  <Image
                    src="/images/icons/paypal.png"
                    alt="PayPal"
                    width={30}
                    height={30}
                    className="me-2"
                  />
                  PayPal (Friends & Family option)
                </li>
              </ul>

              {/* Phone Number */}
              <div className="d-flex align-items-center mt-3">
                <Image
                  src="/images/icons/payment-phone.png"
                  alt="Send To"
                  width={50}
                  height={50}
                  className="me-3"
                />
                <p className="fw-bold fs-5 mb-0">SEND TO: (718) 200-6396</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
