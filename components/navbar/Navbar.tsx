"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaPhone,
  FaEnvelope,
  FaApple,
  FaBars,
  FaCaretDown,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

type Course = {
  course_id: string;
  name: string;
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ action: "get-all-courses" }),
          }
        );
        const data = await response.json();
        if (data?.isSuccess && Array.isArray(data.data)) setCourses(data.data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    }
    fetchCourses();
  }, []);

  const handleLinkClick = () => {
    if (window.innerWidth < 992) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* 🔹 Top Contact Bar */}
      <div className="bg-custom-secondary primary-color-custom d-none d-md-block py-2 fixed-top">
        <div className="container-sm d-flex justify-content-between align-items-center small" style={{ maxWidth: '1166px', margin: '0 auto' }}>
          <div className="d-flex align-items-center gap-3">
            <FaPhone />
            <a
              href="tel:+17182006396"
              className="primary-color-custom text-decoration-none"
            >
              (718)-200-6396
            </a>
            <FaEnvelope />
            <a
              href="mailto:info@asvab-tutoring.com"
              className="primary-color-custom text-decoration-none"
            >
              info@asvab-tutoring.com
            </a>
          </div>
          <div className="d-flex align-items-center gap-2">
            <FaApple />
            <Link
              href="/mobile-app-list"
              className="primary-color-custom text-decoration-none"
            >
              Our Mobile App
            </Link>
          </div>
        </div>
      </div>

      {/* 🔹 Main Navbar */}
      <nav className="navbar navbar-expand-md bg-custom-secondary text-white py-2 py-md-3 fixed-top navbar-desktop-mt">
        <div className="container d-flex justify-content-between align-items-center px-3">
          {/* ✅ Mobile: Logo + Hamburger */}
          <div className="d-flex d-md-none justify-content-between align-items-center w-100">
            <Link href="/" className="navbar-brand">
              <Image className="d-flex justify-content-center align-items-center"
                src="/images/asvab-tutoring-logo.webp"
                width={70}
                height={70}
                alt="Logo"
              />
            </Link>
            <button
              className="navbar-toggler border-0"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <FaBars size={26} className="text-white" />
            </button>
          </div>

          {/* ✅ Desktop Menu (centered logo) */}
          <div className="d-none d-md-flex justify-content-center align-items-center w-100">
            {/* Left Menu */}
            <ul className="navbar-nav flex-row align-items-center me-4 gap-5">
              <li className="nav-item">
                <Link href="/" className="nav-link text-white px-2">
                  HOME
                </Link>
              </li>
              <li
                className={`nav-item dropdown ${isDropdownOpen ? "show" : ""}`}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <span
                  className="nav-link text-white d-flex align-items-center gap-1 px-2"
                  role="button"
                >
                  SERVICES <FaCaretDown className="fs-5" />
                </span>
                <ul
                  className={`dropdown-menu mt-0 ${isDropdownOpen ? "show" : ""
                    }`}
                >
                  {courses.map((course) => (
                    <li key={course.course_id}>
                      <Link
                        className="dropdown-item"
                        href={`/course-detail/${course.course_id}`}
                      >
                        {course.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="nav-item">
                <Link href="/how-it-works" className="nav-link text-white px-2">
                  HOW IT WORKS
                </Link>
              </li>
            </ul>

            {/* Center Logo */}
            <div className="mx-3">
              <Link
                href="/"
                className="navbar-brand d-flex justify-content-center align-items-center"
              >
                <Image
                  src="/images/asvab-tutoring-logo.webp"
                  width={85}
                  height={85}
                  alt="Logo"
                />
              </Link>
            </div>

            {/* Right Menu */}
            <ul className="navbar-nav flex-row align-items-center gap-5 ms-4">
              <li className="nav-item">
                <Link
                  href="/pricing-page"
                  className="nav-link text-white px-2"
                >
                  PRICING
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white px-2">
                  ABOUT US
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/blog" className="nav-link text-white px-2">
                  BLOG
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href="https://test-prep.asvab-tutoring.com/register-free"
                  className="btn border text-white px-3 py-1"
                >
                  ONLINE TEST
                </Link>
              </li>
            </ul>
          </div>

          {/* ✅ Mobile Collapsible Menu */}
          {isMenuOpen && (
            <div className="d-md-none mt-3 w-100 text-left">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link href="/" className="nav-link text-white" onClick={handleLinkClick}>
                    HOME
                  </Link>
                </li>

                {/* Mobile Services Dropdown */}
                <li className="nav-item">
                  <span
                    className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    SERVICES <FaCaretDown />
                  </span>

                  {isDropdownOpen && (
                    <ul className="navbar-nav ps-3">
                      {courses.map((course) => (
                        <li key={course.course_id} className="nav-item">
                          <Link
                            href={`/course-detail/${course.course_id}`}
                            className="nav-link text-white"
                            onClick={handleLinkClick}
                          >
                            {course.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                <li className="nav-item">
                  <Link
                    href="/how-it-works"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    HOW IT WORKS
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/pricing-page"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    PRICING
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/about-us"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    ABOUT US
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/blog"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    BLOG
                  </Link>
                </li>

                <li className="nav-item mt-2">
                  <Link
                    href="https://test-prep.asvab-tutoring.com/register-free"
                    className="btn border text-white w-75"
                    onClick={handleLinkClick}
                  >
                    ONLINE TEST
                  </Link>
                </li>
              </ul>
            </div>
          )}

        </div>
      </nav>
    </>
  );
}
