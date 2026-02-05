"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaPhone,
  FaEnvelope,
  FaApple,
  FaBars,
  FaCaretDown,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

type Course = {
  course_id: string;
  name: string;
};

type ServiceCourse = {
  service_id: string;
  course_name: string;
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<ServiceCourse[]>([]);

  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

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
        if (data?.isSuccess && Array.isArray(data.data)) {
          setCourses(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    }

    async function fetchServices() {
      try {
        const response = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ action: "get-service-course-list" }),
          }
        );
        const data = await response.json();
        if (data?.isSuccess && Array.isArray(data.data)) {
          setServices(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    }

    fetchCourses();
    fetchServices();
  }, []);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setIsMenuOpen(false);
      setIsCoursesOpen(false);
      setIsServicesOpen(false);
      setIsPricingOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);

    // Close all submenus when main menu toggles
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
  };

  // When opening one submenu, close others (mobile only)
  const toggleCourses = () => {
    setIsCoursesOpen(!isCoursesOpen);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
  };

  const toggleServices = () => {
    setIsServicesOpen(!isServicesOpen);
    setIsCoursesOpen(false);
    setIsPricingOpen(false);
  };

  const togglePricing = () => {
    setIsPricingOpen(!isPricingOpen);
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
  };

  return (
    <>
      {/* 🔹 Top Contact Bar */}
      <div className="bg-custom-secondary primary-color-custom d-none d-lg-block py-2 fixed-top">
        <div
          className="container-sm d-flex justify-content-between align-items-center small"
          style={{ maxWidth: "1166px", margin: "0 auto" }}
        >
          <div className="d-flex align-items-center gap-3">
            <FaPhone />
            <a href="tel:+17182006396" className="primary-color-custom text-decoration-none">
              (718)-200-6396
            </a>
            <FaEnvelope />
            <a href="mailto:info@asvab-tutoring.com" className="primary-color-custom text-decoration-none">
              info@asvab-tutoring.com
            </a>
          </div>
          <div className="d-flex align-items-center gap-2">
            <FaApple />
            <Link href="/mobile-app-list" className="primary-color-custom text-decoration-none">
              Our Mobile App
            </Link>
          </div>
        </div>
      </div>

      {/* 🔹 Main Navbar */}
      <nav className="navbar navbar-expand-lg bg-custom-secondary text-white py-2 py-md-3 fixed-top navbar-desktop-mt">
        <div className="container d-flex justify-content-between align-items-center px-3">

          {/* MOBILE HEADER */}
          <div className="d-flex d-lg-none justify-content-between align-items-center w-100">
            <Link href="/" className="navbar-brand">
              <Image src="/images/asvab-tutoring-logo.webp" width={65} height={65} alt="Logo" />
            </Link>

            <button className="navbar-toggler border-0"
              type="button"
              onClick={toggleMenu}
            >
              <FaBars size={26} className="text-white" />
            </button>
          </div>

          {/* DESKTOP MENU */}
          <div className="d-none d-lg-flex justify-content-center align-items-center w-100">

            {/* LEFT MENU */}
            <ul className="navbar-nav flex-row flex-nowrap align-items-center me-2 gap-3 gap-lg-4">

              <li className="nav-item">
                <Link href="/" className="nav-link text-white px-2">HOME</Link>
              </li>
              <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white px-2">ABOUT US</Link>
              </li>
              <li className="nav-item">
                <Link href="/how-it-works" className="nav-link text-white px-2">HOW IT WORKS</Link>
              </li>

              {/* COURSES */}
              <li className="nav-item dropdown"
                onMouseEnter={() => setIsCoursesOpen(true)}
                onMouseLeave={() => setIsCoursesOpen(false)}
              >
                <span className="nav-link text-white d-flex align-items-center gap-1 px-2" role="button">
                  COURSES <FaCaretDown className="fs-6" />
                </span>
                <ul className={`dropdown-menu mt-0 ${isCoursesOpen ? "show" : ""}`}>
                  {courses.map((course) => (
                    <li key={course.course_id}>
                      <Link className="dropdown-item" href={`/course-detail/${course.course_id}`}>
                        {course.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* SERVICES */}
              {/* <li className="nav-item dropdown"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <span className="nav-link text-white d-flex align-items-center gap-1 px-2" role="button">
                  SERVICES <FaCaretDown className="fs-6" />
                </span>
                <ul className={`dropdown-menu mt-0 ${isServicesOpen ? "show" : ""}`}>
                  {services.map((service) => (
                    <li key={service.service_id}>
                      <Link className="dropdown-item" href={`/service-detail/${service.service_id}`}>
                        {service.course_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li> */}

              {/* <li className="nav-item">
                <Link href="/how-it-works" className="nav-link text-white px-2">HOW IT WORKS</Link>
              </li> */}
            </ul>

            {/* CENTER LOGO */}
            <div className="mx-2 mx-md-3">
              <Link href="/" className="navbar-brand">
                <Image src="/images/asvab-tutoring-logo.webp" width={85} height={85} alt="Logo" />
              </Link>
            </div>

            {/* RIGHT MENU */}
            <ul className="navbar-nav flex-row flex-nowrap align-items-center ms-2 gap-3 gap-lg-4">

              {/* SERVICES */}
              <li className="nav-item dropdown"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <span className="nav-link text-white d-flex align-items-center gap-1 px-2" role="button">
                  SERVICES <FaCaretDown className="fs-6" />
                </span>
                <ul className={`dropdown-menu mt-0 ${isServicesOpen ? "show" : ""}`}>
                  {services.map((service) => (
                    <li key={service.service_id}>
                      <Link className="dropdown-item" href={`/service-detail/${service.service_id}`}>
                        {service.course_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {/* PRICING */}
              <li className="nav-item dropdown"
                onMouseEnter={() => setIsPricingOpen(true)}
                onMouseLeave={() => setIsPricingOpen(false)}
              >
                <span className="nav-link text-white d-flex align-items-center gap-1 px-2" role="button">
                  PRICING <FaCaretDown className="fs-6" />
                </span>
                <ul className={`dropdown-menu mt-0 ${isPricingOpen ? "show" : ""}`}>
                  <li><Link href="/pricing-page?submenu=one" className="dropdown-item">1-on-1 Tutoring</Link></li>
                  <li><Link href="/pricing-page?submenu=group" className="dropdown-item">Group Tutoring</Link></li>
                  <li><Link href="/pricing-page?submenu=subscribe" className="dropdown-item">Self Study</Link></li>
                </ul>
              </li>

              {/* <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white px-2">ABOUT US</Link>
              </li> */}

              <li className="nav-item">
                <Link href="/blog" className="nav-link text-white px-2">BLOG</Link>
              </li>

              {/* <li className="nav-item">
                <Link href="https://test-prep.asvab-tutoring.com/register-free" className="btn border text-white px-3 py-1 fs-6">
                  ONLINE STUDY
                </Link>
              </li> */}
               {/* ✅ LOGIN */}
              <li className="nav-item">
                <Link href="/user-login" className="btn btn-outline-light d-flex align-items-center gap-2 px-3">
                  <FaSignInAlt /> Login
                </Link>
              </li>

              {/* ✅ REGISTER */}
              <li className="nav-item">
                <Link
                  href="/user-registration"
                  className="btn d-flex align-items-center gap-2 px-3"
                  style={{ background: "#f2a155", color: "#002341" }}
                >
                  <FaUserPlus /> Register
                </Link>
                </li>

            </ul>
          </div>

          {/* MOBILE COLLAPSIBLE MENU */}
          {isMenuOpen && (
            <div className="d-lg-none mt-3 w-100 text-left">
              <ul className="navbar-nav">

                <li className="nav-item">
                  <Link href="/" className="nav-link text-white" onClick={handleLinkClick}>
                    HOME
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/about-us" className="nav-link text-white" onClick={handleLinkClick}>
                    ABOUT US
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/how-it-works" className="nav-link text-white" onClick={handleLinkClick}>
                    HOW IT WORKS
                  </Link>
                </li>

                {/* COURSES MOBILE */}
                <li className="nav-item">
                  <span className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={toggleCourses}
                  >
                    COURSES <FaCaretDown />
                  </span>

                  {isCoursesOpen && (
                    <ul className="navbar-nav ps-3">
                      {courses.map((course) => (
                        <li key={course.course_id} className="nav-item">
                          <Link href={`/course-detail/${course.course_id}`} className="nav-link text-white" onClick={handleLinkClick}>
                            {course.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                {/* SERVICES MOBILE */}
                <li className="nav-item">
                  <span className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={toggleServices}
                  >
                    SERVICES <FaCaretDown />
                  </span>

                  {isServicesOpen && (
                    <ul className="navbar-nav ps-3">
                      {services.map((service) => (
                        <li key={service.service_id} className="nav-item">
                          <Link href={`/service-detail/${service.service_id}`} className="nav-link text-white" onClick={handleLinkClick}>
                            {service.course_name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                {/* PRICING MOBILE */}
                <li className="nav-item">
                  <span className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={togglePricing}
                  >
                    PRICING <FaCaretDown />
                  </span>

                  {isPricingOpen && (
                    <ul className="navbar-nav ps-3">
                      <li><Link href="/pricing-page?submenu=one" className="nav-link text-white" onClick={handleLinkClick}>1-on-1 Tutoring</Link></li>
                      <li><Link href="/pricing-page?submenu=group" className="nav-link text-white" onClick={handleLinkClick}>Group Tutoring</Link></li>
                      <li><Link href="/pricing-page?submenu=subscribe" className="nav-link text-white" onClick={handleLinkClick}>Self Study</Link></li>
                    </ul>
                  )}
                </li>
                <li className="nav-item">
                  <Link href="/blog" className="nav-link text-white px-2">BLOG</Link>
                </li>

                {/* <li className="nav-item">
                  <Link 
                    href="https://test-prep.asvab-tutoring.com/register-free"
                    className="nav-link text-white d-flex align-items-center btn border px-3 py-1 fs-6"  style={{ maxWidth: "112px", textAlign: "center" }}
                   
                    onClick={handleLinkClick}
                  >
                    ONLINE STUDY
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link href="/user-login" className="nav-link text-white" onClick={handleLinkClick}>
                    <FaSignInAlt /> Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link href="/user-registration" className="nav-link text-white" onClick={handleLinkClick}>
                    <FaUserPlus /> Register
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
