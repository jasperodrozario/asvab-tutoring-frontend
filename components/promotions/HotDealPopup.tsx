"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./HotDealPopup.module.css";

export default function HotDealPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay the popup slightly to catch attention after the page loads
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupCard}>
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close"
        >
          &times;
        </button>

        <span className={styles.badge}>🔥 Limited-Time Offer</span>

        <h3 className={styles.title}>
          <span className={styles.accent}>Summer ASVAB Test Prep</span> Deal!
        </h3>

        <p className={styles.description}>
          <strong>4-week</strong> structured group tutoring program. 3 live and
          recorded sessions per week. Full web access for just{" "}
          <strong>$250</strong>!
        </p>

        <div className={styles.actions}>
          <Link
            href="/pricing/group-tutoring"
            className={styles.ctaBtn}
            onClick={handleClose}
          >
            Sign up for The Deal →
          </Link>
        </div>
      </div>
    </div>
  );
}
