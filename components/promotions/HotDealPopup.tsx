"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./HotDealPopup.module.css";

const SHOW_DELAY_MS = 1500;
const AUTO_DISMISS_MS = 12_000;

export default function HotDealPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [isVisible]);

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
          <span className={styles.date}>(June 20 – July 20)</span>
          <strong>4-week</strong> structured <strong>Group Tutoring</strong>{" "}
          program. 3 live and recorded sessions per week. Full web access for
          just <strong>$250</strong>!
        </p>

        <div className={styles.actions}>
          <Link
            href="/package-details/group-tutoring/asvab"
            className={styles.ctaBtn}
            onClick={handleClose}
          >
            View Deal!
          </Link>
        </div>

        <div className={styles.timerTrack} aria-hidden="true">
          <div
            className={styles.timerBar}
            style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
