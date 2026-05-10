"use client";

import Link from "next/link";
import styles from "./HotDealBanner.module.css";

interface HotDealBannerProps {
  /** If true the banner renders in its full hero style (group-tutoring pages).
   *  If false a compact strip is rendered instead. */
  featured?: boolean;
}

export default function HotDealBanner({
  featured = false,
}: HotDealBannerProps) {
  if (featured) {
    return (
      <div className={styles.heroWrap}>
        {/* Animated badge */}
        <span className={styles.badge}>🔥 Limited-Time Offer</span>

        <div className={styles.heroCard}>
          {/* Left: copy */}
          <div className={styles.copyCol}>
            <p className={styles.eyebrow}>Summer ASVAB Test Prep Deal</p>
            <h2 className={styles.headline}>
              Master Math &amp; English —{" "}
              <span className={styles.accent}>Together</span>
            </h2>

            <ul className={styles.featureList}>
              <li>
                <span className={styles.icon}>📅</span>
                <span>
                  <strong>4-week</strong> structured program — 3 live sessions
                  per week
                </span>
              </li>
              <li>
                <span className={styles.icon}>🎥</span>
                <span>
                  Every session <strong>recorded</strong> — rewatch anytime,
                  anywhere
                </span>
              </li>
              <li>
                <span className={styles.icon}>👥</span>
                <span>
                  Small-group setting — collaborative learning with expert
                  guidance
                </span>
              </li>
              <li>
                <span className={styles.icon}>📚</span>
                <span>
                  Focused on <strong>Mathematics</strong> &amp;{" "}
                  <strong>English</strong> — the two highest-impact ASVAB
                  sections
                </span>
              </li>
              <li>
                <span className={styles.icon}>🌐</span>
                <span>
                  Full web platform access — study materials, practice tests
                  &amp; more
                </span>
              </li>
            </ul>

            <div className={styles.ctaRow}>
              <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>Full Package</span>
                <span className={styles.price}>$250</span>
              </div>
              <Link href="/pricing/group-tutoring" className={styles.ctaBtn}>
                Claim This Deal →
              </Link>
            </div>
          </div>

          {/* Right: decorative */}
          <div className={styles.decorCol} aria-hidden="true">
            <div className={styles.circle1} />
            <div className={styles.circle2} />
            <div className={styles.decorText}>
              <p className={styles.decorPrice}>$250</p>
              <p className={styles.decorSub}>Full 4-Week Package</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Compact strip (other service pages) ──────────────────────────────── */
  return (
    <div className={styles.stripWrap}>
      <span className={styles.stripBadge}>🔥 Hot Deal</span>
      <p className={styles.stripText}>
        <strong>Summer Group Tutoring — $250</strong> for 4 weeks of live &amp;
        recorded sessions covering Math &amp; English.
      </p>
      <Link href="/pricing/group-tutoring" className={styles.stripBtn}>
        See Deal
      </Link>
    </div>
  );
}
