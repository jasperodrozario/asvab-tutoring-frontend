"use client"

import Image from "next/image";
import Link from "next/link";
import { FaPhone, FaEnvelope, FaApple, FaBars, FaCaretDown } from "react-icons/fa";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-custom-secondary primary-color-custom d-none d-md-block py-2">
        <div className="container-fluid d-flex justify-content-between align-items-center small">
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
            <a
              href="https://your-mobile-app-link.com"
              className="primary-color-custom text-decoration-none"
            >
              Our Mobile App
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar navbar-expand-md bg-custom-secondary text-white py-3">
        <div className="container-fluid">
          {/* Logo */}
          <Link href="/" className="navbar-brand">
            <Image
              src="/images/asvab-tutoring-logo.webp"
              width={80}
              height={80}
              alt="Logo"
            />
          </Link>

          {/* Hamburger Toggler */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            <FaBars size={32} className="text-white" />
          </button>

          {/* Menu Items */}
          <div className={`collapse navbar-collapse justify-content-end ${isMenuOpen ? "show" : ""}`} id="navbarMenu">
            <ul className="navbar-nav align-items-center gap-3">
              <li className="nav-item">
                <Link href="/" className="nav-link text-white">HOME</Link>
              </li>

              {/* Dropdown */}
              <li className="nav-item dropdown position-relative">
                <Link href="/service"
                  className="nav-link text-white d-flex align-items-center gap-1"
                  id="servicesDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  SERVICES <FaCaretDown className="fs-4" />
                </Link>
                <ul className="dropdown-menu mt-0" aria-labelledby="servicesDropdown">
                  <li><Link  className="dropdown-item" href="/course-detail/8">ASVAB</Link></li>
                  <li><Link className="dropdown-item" href="/course-detail/9">ASTB</Link></li>
                  <li><Link className="dropdown-item" href="oar.html">OAR</Link></li>
                  <li><Link className="dropdown-item" href="afoqt.html">AFOQT</Link></li>
                  <li><Link className="dropdown-item" href="sift.html">SIFT</Link></li>
                </ul>
              </li>

              <li className="nav-item">
                <Link href="/how-it-works" className="nav-link text-white">HOW IT WORKS</Link>
              </li>
              <li className="nav-item">
                <Link href="price.html" className="nav-link text-white">PRICING</Link>
              </li>
              <li className="nav-item">
                <Link href="/about-us" className="nav-link text-white">ABOUT US</Link>
              </li>
              <li className="nav-item">
                <Link href="blog.html" className="nav-link text-white">BLOG</Link>
              </li>
              <li className="nav-item">
                <Link href="https://test-prep.asvab-tutoring.com/register-free" className="btn border text-white">ONLINE TEST</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
