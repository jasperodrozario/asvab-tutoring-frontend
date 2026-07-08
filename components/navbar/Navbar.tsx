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
import { useState, useEffect, useRef } from "react";
import { groupCoursesForNav } from "@/lib/package-utils";
import "bootstrap/dist/css/bootstrap.min.css";

type Course = {
  course_id: string;
  course_code: string;
  name: string;
};

type Service = {
  service_id: string;
  course_name: string;
};

function CourseNavGroups({
  courses,
  variant,
  onLinkClick,
}: {
  courses: Course[];
  variant: "desktop" | "mobile";
  onLinkClick?: () => void;
}) {
  const { military, medical, other } = groupCoursesForNav(courses);

  const renderCourse = (course: Course) => (
    <li
      key={course.course_id}
      className={`navbar-course-item ${variant === "mobile" ? "nav-item" : ""}`}
    >
      <Link
        className={variant === "desktop" ? "dropdown-item" : "nav-link text-white"}
        href={`/courses/${course.course_code}`}
        onClick={onLinkClick}
      >
        {course.name}
      </Link>
    </li>
  );

  const renderGroup = (
    label: string,
    groupCourses: Course[],
    showDivider: boolean,
  ) => {
    if (groupCourses.length === 0) return null;

    return (
      <>
        {showDivider && variant === "desktop" && (
          <li>
            <hr className="dropdown-divider my-1" />
          </li>
        )}
        <li
          className={variant === "mobile" ? "nav-item" : undefined}
          aria-hidden="true"
        >
          <span className="navbar-course-category">{label}</span>
        </li>
        {groupCourses.map(renderCourse)}
      </>
    );
  };

  return (
    <>
      {renderGroup("Military", military, false)}
      {renderGroup("Medical", medical, military.length > 0)}
      {other.map(renderCourse)}
    </>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isFreeTestsOpen, setIsFreeTestsOpen] = useState(false);

  const getServiceSlug = (serviceId: string) => {
    switch (serviceId) {
      case "2":
        return "1-on-1-tutoring";
      case "3":
        return "group-tutoring";
      case "4":
        return "self-study";
      default:
        return "unknown";
    }
  };

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch("/api/courses");
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
        const response = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ action: "get-service-course-list" }),
        });
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

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
    setIsFreeTestsOpen(false);
  };

  // Close navbar on outside click or scroll
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isMenuOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };

    const handleScroll = () => {
      if (isMenuOpen) {
        closeAll();
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1090) {
      closeAll();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);

    // Close all submenus when main menu toggles
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
    setIsFreeTestsOpen(false);
  };

  // When opening one submenu, close others (mobile only)
  const toggleCourses = () => {
    setIsCoursesOpen(!isCoursesOpen);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
    setIsFreeTestsOpen(false);
  };

  const toggleServices = () => {
    setIsServicesOpen(!isServicesOpen);
    setIsCoursesOpen(false);
    setIsPricingOpen(false);
    setIsFreeTestsOpen(false);
  };

  const togglePricing = () => {
    setIsPricingOpen(!isPricingOpen);
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
    setIsFreeTestsOpen(false);
  };

  const toggleFreeTests = () => {
    setIsFreeTestsOpen(!isFreeTestsOpen);
    setIsCoursesOpen(false);
    setIsServicesOpen(false);
    setIsPricingOpen(false);
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
              href="/our-mobile-apps"
              className="primary-color-custom text-decoration-none"
            >
              Our Mobile Apps
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        ref={navRef}
        className="navbar navbar-expand-lg bg-custom-secondary text-white py-2 py-md-3 fixed-top navbar-desktop-mt"
      >
        <div className="container d-flex justify-content-between align-items-center px-3">
          {/* MOBILE HEADER */}
          <div className="d-flex d-lg-none justify-content-between align-items-center w-100">
            <Link href="/" className="navbar-brand">
              <img
                src="/images/asvab-tutoring-logo.webp"
                width="65"
                height="65"
                alt="Logo"
              />
            </Link>

            <button
              className="navbar-toggler border-0"
              type="button"
              onClick={toggleMenu}
            >
              <FaBars
                size={26}
                className={isMenuOpen ? "primary-color-custom" : "text-white"}
              />
            </button>
          </div>

          {/* DESKTOP MENU */}
          <div className="d-none d-lg-flex justify-content-center align-items-center w-100">
            {/* LEFT MENU */}
            <ul className="navbar-nav flex-row flex-nowrap align-items-center me-2 gap-3 gap-lg-4">
              <li className="nav-item">
                <Link href="/" className="nav-link text-white px-2">
                  HOME
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white px-2">
                  ABOUT US
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/how-it-works" className="nav-link text-white px-2">
                  HOW IT WORKS
                </Link>
              </li>

              {/* COURSES */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setIsCoursesOpen(true)}
                onMouseLeave={() => setIsCoursesOpen(false)}
              >
                <span
                  className="nav-link text-white d-flex align-items-center gap-1 px-2"
                  role="button"
                >
                  COURSES <FaCaretDown className="fs-6" />
                </span>
                <ul
                  className={`dropdown-menu mt-0 ${isCoursesOpen ? "show" : ""}`}
                >
                  <CourseNavGroups courses={courses} variant="desktop" />
                </ul>
              </li>

              {/* FREE TESTS */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setIsFreeTestsOpen(true)}
                onMouseLeave={() => setIsFreeTestsOpen(false)}
              >
                <span
                  className="nav-link text-white d-flex align-items-center gap-1 px-2"
                  role="button"
                >
                  FREE TESTS <FaCaretDown className="fs-6" />
                </span>
                <ul
                  className={`dropdown-menu mt-0 ${isFreeTestsOpen ? "show" : ""}`}
                >
                  <li>
                    <Link
                      className="dropdown-item"
                      href="/free-prediction-tests"
                      onClick={handleLinkClick}
                    >
                      Free Prediction Tests
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      href="/free-practice-tests"
                      onClick={handleLinkClick}
                    >
                      Free Practice Tests
                    </Link>
                  </li>
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
                <img
                  src="/images/asvab-tutoring-logo.webp"
                  width="65"
                  height="65"
                  alt="Logo"
                />
              </Link>
            </div>

            {/* RIGHT MENU */}
            <ul className="navbar-nav flex-row flex-nowrap align-items-center ms-2 gap-3 gap-lg-4">
              {/* SERVICES */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <span
                  className="nav-link text-white d-flex align-items-center gap-1 px-2"
                  role="button"
                >
                  SERVICES <FaCaretDown className="fs-6" />
                </span>
                <ul
                  className={`dropdown-menu mt-0 ${isServicesOpen ? "show" : ""}`}
                >
                  {services.map((service) => (
                    <li key={service.service_id}>
                      <Link
                        className="dropdown-item"
                        href={`/services/${getServiceSlug(service.service_id)}`}
                      >
                        {service.course_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {/* PRICING */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setIsPricingOpen(true)}
                onMouseLeave={() => setIsPricingOpen(false)}
              >
                <span
                  className="nav-link text-white d-flex align-items-center gap-1 px-2"
                  role="button"
                >
                  PRICING <FaCaretDown className="fs-6" />
                </span>
                <ul
                  className={`dropdown-menu mt-0 ${isPricingOpen ? "show" : ""}`}
                >
                  {services.map((service) => (
                    <li key={service.service_id}>
                      <Link
                        className="dropdown-item"
                        href={`/pricing/${getServiceSlug(service.service_id)}`}
                      >
                        {service.course_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white px-2">ABOUT US</Link>
              </li> */}

              <li className="nav-item">
                <Link href="/blog" className="nav-link text-white px-2">
                  BLOG
                </Link>
              </li>

              {/* <li className="nav-item">
                    <Link href={`${process.env.NEXT_PUBLIC_RESOURCES_URL}/register-free`} className="btn border text-white px-3 py-1 fs-6">
                      ONLINE STUDY
                    </Link>
                  </li> */}
              {/* LOGIN */}
              <li className="nav-item">
                <Link
                  href="/user-login"
                  className="btn btn-outline-light d-flex align-items-center gap-2 px-3"
                >
                  <FaSignInAlt /> Login
                </Link>
              </li>

              {/* REGISTER */}
              <li className="nav-item">
                <Link
                  href="/user-registration"
                  className="btn btn-outline-light d-flex align-items-center gap-2 px-3"
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
                  <Link
                    href="/"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    HOME
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
                    href="/how-it-works"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    HOW IT WORKS
                  </Link>
                </li>

                {/* COURSES MOBILE */}
                <li className="nav-item">
                  <span
                    className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={toggleCourses}
                  >
                    COURSES <FaCaretDown />
                  </span>

                  {isCoursesOpen && (
                    <ul className="navbar-nav ps-3">
                      <CourseNavGroups
                        courses={courses}
                        variant="mobile"
                        onLinkClick={handleLinkClick}
                      />
                    </ul>
                  )}
                </li>

                {/* FREE TESTS MOBILE */}
                <li className="nav-item">
                  <span
                    className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={toggleFreeTests}
                  >
                    FREE TESTS <FaCaretDown />
                  </span>

                  {isFreeTestsOpen && (
                    <ul className="navbar-nav ps-3">
                      <li className="nav-item">
                        <Link
                          href="/free-prediction-tests"
                          className="nav-link text-white"
                          onClick={handleLinkClick}
                        >
                          Free Prediction Tests
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          href="/free-practice-tests"
                          className="nav-link text-white"
                          onClick={handleLinkClick}
                        >
                          Free Practice Tests
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                {/* SERVICES MOBILE */}
                <li className="nav-item">
                  <span
                    className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={toggleServices}
                  >
                    SERVICES <FaCaretDown />
                  </span>

                  {isServicesOpen && (
                    <ul className="navbar-nav ps-3">
                      {services.map((service) => (
                        <li key={service.service_id} className="nav-item">
                          <Link
                            href={`/services/${getServiceSlug(service.service_id)}`}
                            className="nav-link text-white"
                            onClick={handleLinkClick}
                          >
                            {service.course_name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>

                {/* PRICING MOBILE */}
                <li className="nav-item">
                  <span
                    className="nav-link text-white d-flex align-items-center gap-1"
                    role="button"
                    onClick={togglePricing}
                  >
                    PRICING <FaCaretDown />
                  </span>

                  {isPricingOpen && (
                    <ul className="navbar-nav ps-3">
                      {services.map((service) => (
                        <li key={service.service_id}>
                          <Link
                            className="dropdown-item"
                            href={`/pricing/${getServiceSlug(service.service_id)}`}
                          >
                            {service.course_name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                <li className="nav-item">
                  <Link href="/blog" className="nav-link text-white px-2">
                    BLOG
                  </Link>
                </li>

                {/* <li className="nav-item">
                  <Link 
                    href={`${process.env.NEXT_PUBLIC_RESOURCES_URL}/register-free"
                    className="nav-link text-white d-flex align-items-center btn border px-3 py-1 fs-6"  style={{ maxWidth: "112px", textAlign: "center" }}
                   
                    onClick={handleLinkClick}
                  >
                    ONLINE STUDY
                  </Link>
                </li> */}
                <li className="nav-item">
                  <Link
                    href="/user-login"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
                    <FaSignInAlt /> Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    href="/user-registration"
                    className="nav-link text-white"
                    onClick={handleLinkClick}
                  >
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
