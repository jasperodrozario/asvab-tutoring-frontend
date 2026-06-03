import type { Metadata } from "next";
import Welcome from "@/components/welcome/Welcome";
import { homeMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = homeMetadata();
import TopCourses from "@/components/topcourses/Topcourses";
import Teachers from "@/components/teachers/Teachers";
import Faq from "@/components/faq/Faq";
import Review from "@/components/review/Review";
import Packages from "@/components/packages/Packages";
import PricingPackages from "@/components/pricing-packages/PricingPackages";
import HotDealPopup from "@/components/promotions/HotDealPopup";

export default function Home() {
  return (
    <div>
      <Welcome />
      <TopCourses />
      {/* <Packages /> */}

      {/* 1-on-1 Tutoring Pricing */}
      <PricingPackages
        fixedSubmenu="one"
        sectionTitle="1-on-1 Tutoring Pricing"
        homepageDescription="ASVAB Tutoring’s 1:1 Online Tutoring provide focused, two-hour live sessions led by an experienced instructor dedicated to your success. Through personalized guidance, structured lessons, and free access to all online study materials, students strengthen core skills, raise their scores, master key concepts, and prepare with confidence for test day."
      />

      {/* Group Tutoring Pricing */}
      <PricingPackages
        fixedSubmenu="group"
        sectionTitle="Group Tutoring Pricing"
        homepageDescription="ASVAB Tutoring’s Group Online Tutoring provide focused, two-hour live sessions led by an experienced instructor dedicated to your success. Each group is intentionally kept small to ensure every learner receives focused instruction while benefiting from peer interaction, shared discussions, and collective problem-solving."
      />

      {/* Self Study Pricing */}
      <PricingPackages
        fixedSubmenu="subscribe"
        sectionTitle="Self-Study Pricing"
        homepageDescription="ASVAB Tutoring’s Self-Study Course offers expertly crafted study materials developed by highly experienced instructors. This program helps you strengthen core skills, improve your scores, understand key concepts clearly, and prepare with confidence for test day."
      />

      <Teachers />
      <Faq />
      <Review />

      {/* ── Pop-in Notification ── */}
      <HotDealPopup />
    </div>
  );
}
