import Welcome from "@/components/welcome/Welcome";
import TopCourses from "@/components/topcourses/Topcourses";
import Teachers from "@/components/teachers/Teachers";
import Faq from "@/components/faq/Faq";
import Review from "@/components/review/Review";
import Packages from "@/components/packages/Packages";
import PricingPackages from "@/components/pricing-packages/PricingPackages";

export default function Home() {
  return (
    <div>
      <Welcome />
      <TopCourses />
      {/* <Packages /> */}
      <PricingPackages
        fixedSubmenu="one"
        sectionTitle="Our Tutoring Pricing"
        homepageDescription="ASVAB Tutoring’s 1:1 Online Tutoring and Group Tutoring programs provide focused, two-hour live sessions led by an experienced instructor dedicated to your success. Through personalized guidance, structured lessons, and free access to all online study materials, students strengthen core skills, raise their scores, master key concepts, and prepare with confidence for test day."
      />

      <PricingPackages
        fixedSubmenu="subscribe"
        sectionTitle="Self Study Pricing"
        homepageDescription="ASVAB Tutoring’s Self-Study Course offers expertly crafted study materials developed by highly experienced instructors. This program helps you strengthen core skills, improve your scores, understand key concepts clearly, and prepare with confidence for test day."
      />

      <Teachers />
      <Faq />
      <Review />
    </div>
  );
}
