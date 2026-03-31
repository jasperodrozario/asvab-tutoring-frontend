"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FaArrowUp } from "react-icons/fa";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    // Add a small delay to ensure the new page content has loaded
    // and to avoid conflicts with any browser restore scroll behavior
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const toggleVisibility = () => {
      // Use document.documentElement.scrollTop for better mobile compatibility
      const scrollTop = window.scrollY ?? document.documentElement.scrollTop;
      // Show button when page is scrolled down 300px
      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Use passive event listener for better scroll performance on mobile
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    // Also check on touchmove for mobile
    window.addEventListener("touchmove", toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      window.removeEventListener("touchmove", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <button
        className={`scroll-to-top ${isVisible ? "visible" : ""}`}
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Scroll to top"
        style={{
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? "visible" : "hidden",
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <FaArrowUp
          className={`transition-transform ${isHovered ? "scale-110" : ""}`}
          style={{
            transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          }}
        />
      </button>
    </>
  );
}
