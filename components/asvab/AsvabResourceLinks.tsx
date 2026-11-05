import Link from "next/link";
import { ASVAB_RESOURCES, type AsvabResourcePath } from "@/lib/asvab-resources";
import styles from "./AsvabResources.module.css";

type Props = {
  paths?: readonly AsvabResourcePath[];
  title?: string;
};

export default function AsvabResourceLinks({
  paths,
  title = "ASVAB preparation resources",
}: Props) {
  const resources = paths
    ? ASVAB_RESOURCES.filter((resource) => paths.includes(resource.path))
    : ASVAB_RESOURCES;

  return (
    <section className={styles.resources} aria-label={title}>
      <h2>{title}</h2>
      <p>Choose the next step for your ASVAB preparation.</p>
      <ul className={styles.resourceGrid}>
        {resources.map((resource) => (
          <li key={resource.path}>
            <Link href={resource.path} className={styles.resourceCard}>
              <span className={styles.resourceTitle}>{resource.label}</span>
              <span>{resource.description}</span>
              <span className={styles.resourceArrow} aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
