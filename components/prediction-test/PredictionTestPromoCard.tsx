import Link from "next/link";
import styles from "./predictionTestCta.module.css";

type Props = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  disabled?: boolean;
  buttonClassName?: string;
  buttonIconClass?: string;
};

export default function PredictionTestPromoCard({
  href,
  eyebrow,
  title,
  text,
  buttonLabel,
  disabled = false,
  buttonClassName,
  buttonIconClass = "bi-arrow-right",
}: Props) {
  const btnClass = `btn w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-2 ${buttonClassName ?? styles.promoCardBtn}`;
  return (
    <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${styles.promoCard}`}>
      <div className={styles.promoCardBody}>
        <div className={styles.promoCardIconWrap} aria-hidden>
          <i className="bi bi-graph-up-arrow" />
        </div>
        <p className={styles.promoCardEyebrow}>{eyebrow}</p>
        <p className={styles.promoCardTitle}>{title}</p>
        <p className={styles.promoCardText}>{text}</p>
        {disabled ? (
          <button type="button" className={btnClass} disabled>
            <i className={`bi ${buttonIconClass}`} aria-hidden />
            {buttonLabel}
          </button>
        ) : (
          <Link href={href} className={btnClass}>
            {buttonLabel}
            <i className={`bi ${buttonIconClass}`} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
