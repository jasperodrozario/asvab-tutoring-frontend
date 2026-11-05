import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./AsvabResources.module.css";

type ResourceAction = { href: string; label: string };

type Props = {
  title: string;
  label: string;
  intro: ReactNode;
  action: ResourceAction;
  secondaryAction?: ResourceAction;
  contents: readonly { id: string; label: string }[];
  closing?: ReactNode;
  children: ReactNode;
};

export default function AsvabResourceLayout({
  title,
  label,
  intro,
  action,
  secondaryAction,
  contents,
  closing,
  children,
}: Props) {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <div className="container">
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/courses/asvab">ASVAB</Link></li>
              <li aria-current="page">{label}</li>
            </ol>
          </nav>
          <p className={styles.eyebrow}>ASVAB Tutoring · Preparation resources</p>
          <h1>{title}</h1>
          <div className={styles.intro}>{intro}</div>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href={action.href}>
              {action.label}
            </Link>
            {secondaryAction ? (
              <Link className={styles.secondaryAction} href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className={`container ${styles.bodyGrid}`}>
        <nav aria-label="On this page" className={styles.contents}>
          <p className={styles.contentsTitle}>On this page</p>
          <ul>
            {contents.map((item) => (
              <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>
            ))}
          </ul>
          <Link href="/courses/asvab" className={styles.courseLink}>
            Explore the ASVAB course →
          </Link>
        </nav>

        <div className={styles.article}>
          {children}
          <section className={styles.closing} aria-label="Your next step">
            <h2>Take your next step</h2>
            {closing ? <p>{closing}</p> : null}
            <Link className={styles.primaryAction} href={action.href}>
              {action.label}
            </Link>
          </section>
        </div>
      </div>
    </article>
  );
}
