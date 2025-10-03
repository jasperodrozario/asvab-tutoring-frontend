'use client';

import Link from 'next/link';
import Image from "next/image";

import { useEffect, useState } from 'react';

export default function Footer() {
  // Add client-side only state to handle rendering
  const [isMounted, setIsMounted] = useState(false);

  // Only render the component after it's mounted on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create a simple placeholder with similar structure for SSR
  if (!isMounted) {
    return <footer className="text-white py-5"><div className="container"></div></footer>;
  }

  return (
    <footer
      className="text-white py-5"
      style={{
        background: "url('/images/footer_bg.jpg') center center/cover no-repeat",
      }}
    >
      <div className="container">
        <div className="row gy-4">
          {/* About Us */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="fw-semibold mb-3">ABOUT US</h5>
            <p className="small">
              The days are gone when you need to prove yourself as a good
              student by memorizing whole subjects. Nowadays you can just learn
              the tech.
            </p>
            <Link href="/about" className="read-more-link mt-4 d-inline-block">
              READ MORE &gt;&gt;
            </Link>
          </div>

          {/* Featured Links */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="fw-semibold mb-3">FEATURED LINKS</h5>
            <div className="row">
              <ul className="list-unstyled col-6">
                <li className="mb-3">
                  <Link href="/pricing-page" className="footer-link">
                    <span>&gt;&gt;</span> Pricing
                  </Link>
                </li>
                <li className="mb-3">
                  <Link href="/courses" className="footer-link">
                    <span>&gt;&gt;</span> Courses
                  </Link>
                </li>
                <li className="mb-3">
                  <Link href="/about" className="footer-link">
                    <span>&gt;&gt;</span> About Us
                  </Link>
                </li>
              </ul>
              <ul className="list-unstyled col-6">
                <li className="mb-3">
                  <Link href="/blog" className="footer-link">
                    <span>&gt;&gt;</span> Blog
                  </Link>
                </li>
                <li className="mb-3">
                  <Link href="/faqs" className="footer-link">
                    <span>&gt;&gt;</span> FAQs
                  </Link>
                </li>
                <li className="mb-3">
                  <Link href="/sitemap" className="footer-link">
                    <span>&gt;&gt;</span> Sitemap
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Keep in Touch */}
          {/* Keep in Touch */}
          {/* Keep in Touch */}
<div className="col-12 col-md-6 col-lg-3">
  <h5 className="fw-semibold mb-3">KEEP IN TOUCH</h5>
  
  {/* Social Icons */}
  <div className="d-flex gap-3 mb-3">
    <a
      href="https://x.com/asvabtutoring18"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white text-decoration-none fs-5 footer-icon"
    >
      <i className="bi bi-twitter-x"></i>
    </a>
    <a
      href="https://www.facebook.com/asvabtutoring"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white text-decoration-none fs-5 footer-icon"
    >
      <i className="bi bi-facebook"></i>
    </a>
    <a
      href="https://www.youtube.com/channel/UCCVP6UtL3O2-gQJa9KwRMXw"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white text-decoration-none fs-5 footer-icon"
    >
      <i className="bi bi-youtube"></i>
    </a>
    <a
      href="https://www.instagram.com/asvabtutoring/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-white text-decoration-none fs-5 footer-icon"
    >
      <i className="bi bi-instagram"></i>
    </a>
  </div>

  {/* App Store Badges */}
  <div className="d-flex gap-2 mt-2">
    <a
      href="https://play.google.com/store/apps/details?id=com.asvab.tutoring"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src="/images/Google_Play_Store_badge_EN.svg"
        alt="Google Play"
        width={150}
        height={40}
      />
    </a>

    <a
      href="https://apps.apple.com/us/app/asvab-tutoring/id1518771904"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src="/images/download-on-the-app-store.svg"
        alt="App Store"
        width={150}
        height={40}
      />
    </a>
  </div>
</div>



          {/* Contact */}
          <div className="col-12 col-md-6 col-lg-3">
            <h5 className="fw-semibold mb-3">CONTACT</h5>
            <p className="small mb-2">
              <i className="bi bi-geo-alt-fill me-2 primary-color-custom"></i>
              United States
            </p>
            <p className="small mb-2">
              <i className="bi bi-envelope-fill me-2 primary-color-custom"></i>
              info@asvab-tutoring.com
            </p>
            <p className="small mb-2">
              <i className="bi bi-telephone-fill me-2 primary-color-custom"></i>
              (718)-200-6396
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center small pt-4 mt-4 border-top border-light">
          <p className="mb-1">© 2022 ASVAB TUTORING LLC All Rights Reserved</p>
          <Link href="/privacy-policy" className="text-warning text-decoration-none">
            Privacy Policy
          </Link>{' '}
          |{' '}
          <Link href="/terms-of-service" className="text-warning text-decoration-none">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}