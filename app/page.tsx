import type { Metadata } from "next";
import Welcome from "@/components/welcome/Welcome";
import TopCourses from "@/components/topcourses/Topcourses";
import FreeTestsShowcase from "@/components/free-tests-showcase/FreeTestsShowcase";
import Teachers from "@/components/teachers/Teachers";
import Faq from "@/components/faq/Faq";
import Review from "@/components/review/Review";
import PricingPackages from "@/components/pricing-packages/PricingPackages";
import { homeMetadata } from "@/lib/page-metadata";
import {
  fetchAllCourses,
  fetchFaqs,
  fetchNotices,
  fetchPublishablePricingPackages,
  fetchStateList,
  fetchTutorList,
  fetchWebUserFeedback,
  fetchWelcomeText,
} from "@/lib/php-api";
import Link from "next/link";

export const metadata: Metadata = homeMetadata();
export const revalidate = 3600;

export default async function Home() {
  const [
    oneOnOnePackages,
    groupPackages,
    selfStudyPackages,
    states,
    userFeedbacks,
    courses,
    tutors,
    faqs,
    welcome,
    notices,
  ] = await Promise.all([
    fetchPublishablePricingPackages("one"),
    fetchPublishablePricingPackages("group"),
    fetchPublishablePricingPackages("subscribe"),
    fetchStateList(),
    fetchWebUserFeedback(),
    fetchAllCourses(),
    fetchTutorList(),
    fetchFaqs(),
    fetchWelcomeText(),
    fetchNotices(),
  ]);

  return (
    <div>
      <Welcome
        initialStates={states}
        initialWelcome={welcome}
        initialNotices={notices}
      />
      <div className="bg-dark-blue text-white">
        <TopCourses initialCourses={courses} />
        <FreeTestsShowcase />
      </div>

      <PricingPackages
        fixedSubmenu="one"
        sectionTitle="1-on-1 Tutoring Pricing"
        initialPackages={oneOnOnePackages}
        homepageDescription={
          <>
            <Link
              href="/services/1-on-1-tutoring"
              className="text-primary text-decoration-underline fw-bold"
            >
              ASVAB Tutoring’s 1:1 Online Tutoring
            </Link>{" "}
            provide focused, two-hour live sessions led by an experienced
            instructor dedicated to your success. Through personalized guidance,
            structured lessons, and free access to all online study materials,
            students strengthen core skills, raise their scores, master key
            concepts, and prepare with confidence for test day.
          </>
        }
      />

      <PricingPackages
        fixedSubmenu="group"
        sectionTitle="Group Tutoring Pricing"
        initialPackages={groupPackages}
        homepageDescription={
          <>
            <Link
              href="/services/group-tutoring"
              className="text-primary text-decoration-underline fw-bold"
            >
              ASVAB Tutoring’s Group Online Tutoring
            </Link>{" "}
            provide focused, two-hour live sessions led by an experienced
            instructor dedicated to your success. Each group is intentionally
            kept small to ensure every learner receives focused instruction
            while benefiting from peer interaction, shared discussions, and
            collective problem-solving.
          </>
        }
      />

      <PricingPackages
        fixedSubmenu="subscribe"
        sectionTitle="Self-Study Pricing"
        initialPackages={selfStudyPackages}
        homepageDescription={
          <>
            <Link
              href="/services/self-study"
              className="text-primary text-decoration-underline fw-bold"
            >
              ASVAB Tutoring’s Self-Study Course
            </Link>{" "}
            offers expertly crafted study materials developed by highly
            experienced instructors. This program helps you strengthen core
            skills, improve your scores, understand key concepts clearly, and
            prepare with confidence for test day.
          </>
        }
      />

      <Teachers initialTutors={tutors} />
      <Faq initialFaqs={faqs} />
      <Review reviews={userFeedbacks} />
    </div>
  );
}
