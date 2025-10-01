"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FaPhone,
  FaEnvelope,
  FaApple,
  FaBars,
  FaCaretDown,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";

type Course = {
  course_id: string;
  name: string;
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hydrated, setHydrated] = useState(false); // ✅ track hydration

  // ✅ client-side only
  useEffect(() => {
    setHydrated(true); // mark that client has hydrated
    const authCookie = Cookies.get("admin-auth");
    setIsAdmin(!!authCookie);
  }, []);

  const router = useRouter();
  const handleLogout = () => {
    Cookies.remove("admin-auth");
    setIsAdmin(false);
    router.push("/");
    // window.location.href = "/"; // reload to update Navbar
  };

  // Fetch courses for Services menu
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch(
          "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
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

    fetchCourses();
  }, []);

  // ⚠️ render nothing until client hydration done
  if (!hydrated) return null;

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-custom-secondary primary-color-custom d-none d-md-block py-2 fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center small">
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

      {/* Main Navbar */}
      <nav className="navbar navbar-expand-md bg-custom-secondary text-white py-3 fixed-top navbar-desktop-mt">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <Image src="/images/asvab-tutoring-logo.webp" width={80} height={80} alt="Logo" />
          </Link>

          <button className="navbar-toggler" type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation">
            <FaBars size={28} className="text-white" />
          </button>

          <div className={`collapse navbar-collapse justify-content-end ${isMenuOpen ? "show" : ""}`} id="navbarMenu">
            <ul className="navbar-nav align-items-center gap-3">
              <li className="nav-item">
                <Link href="/" className="nav-link text-white">HOME</Link>
              </li>

              {/* Services Dropdown */}
              <li className={`nav-item dropdown ${isDropdownOpen ? "show" : ""}`} onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                <span className="nav-link text-white d-flex align-items-center gap-1" role="button" aria-expanded={isDropdownOpen}>
                  SERVICES <FaCaretDown className="fs-5" />
                </span>
                <ul className={`dropdown-menu mt-0 ${isDropdownOpen ? "show" : ""}`}>
                  {courses.length > 0 ? courses.map(course => (
                    <li key={course.course_id}>
                      <Link className="dropdown-item" href={`/course-detail/${course.course_id}`}>{course.name}</Link>
                    </li>
                  )) : (
                    <li><span className="dropdown-item text-muted">No courses available</span></li>
                  )}
                </ul>
              </li>

              <li className="nav-item"><Link href="/how-it-works" className="nav-link text-white">HOW IT WORKS</Link></li>
              <li className="nav-item"><Link href="/pricing-page" className="nav-link text-white">PRICING</Link></li>
              <li className="nav-item"><Link href="/about-us" className="nav-link text-white">ABOUT US</Link></li>
              <li className="nav-item"><Link href="/blog" className="nav-link text-white">BLOG</Link></li>

              {/* Always show Online Test */}
              <li className="nav-item">
                <Link href="https://test-prep.asvab-tutoring.com/register-free" className="btn border text-white">
                  ONLINE TEST
                </Link>
              </li>

              {/* Admin Dashboard & Logout */}
              {isAdmin && (
                <>
                  <li className="nav-item">
                    <Link href="/admin" className="btn btn-warning d-flex align-items-center gap-2">
                      <FaTachometerAlt /> Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="btn btn-danger d-flex align-items-center gap-2">
                      <FaSignOutAlt /> Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
