import Link from "next/link";
import prepStyles from "@/components/pricing/coursePricing.module.css";
import styles from "./predictionTestCta.module.css";

type Props = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  buttonLabel: string;
  benefits?: string[];
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
  benefits,
  disabled = false,
  buttonClassName,
  buttonIconClass = "bi-arrow-right",
}: Props) {
  const btnClass = `btn fw-bold d-inline-flex align-items-center justify-content-center gap-2 px-5 ${buttonClassName ?? styles.promoCardBtn}`;
  return (
    <div className={`card border-0 shadow-sm rounded-4 overflow-hidden ${styles.promoCard}`}>
      <div className={styles.promoCardBody}>
        <div className={styles.promoCardIconWrap} aria-hidden>
          <i className="bi bi-graph-up-arrow" />
        </div>
        <p className={styles.promoCardEyebrow}>{eyebrow}</p>
        <p className={styles.promoCardTitle}>{title}</p>
        <p className={styles.promoCardText}>{text}</p>
        {benefits && benefits.length > 0 ? (
          <ul className={`${prepStyles.prepIntroBenefits} ${styles.promoCardBenefits}`}>
            {benefits.map((benefit) => (
              <li key={benefit}>
                <i className="bi bi-check-circle-fill" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}
        {disabled ? (
          <button type="button" className={btnClass} disabled>
            <i className={`bi ${buttonIconClass}`} aria-hidden />
            {buttonLabel}
          </button>
        ) : (
          <Link href={href} className={btnClass} style={{ boxShadow: "2px 2px 5px rgba(0, 35, 65, 0.28)", fontSize: "1.15rem" }}>
            {buttonLabel}
            <i className={`bi ${buttonIconClass}`} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
