
import Welcome from "@/components/welcome/Welcome";
import TopCourses from "@/components/topcourses/Topcourses";
import Teachers from "@/components/teachers/Teachers";
import Faq from "@/components/faq/Faq";
import Review from "@/components/review/Review";
import Packages from "@/components/packages/Packages";

export default function Home() {
  return (
    <div>
     <Welcome />
     <TopCourses />
     <Packages />
     <Teachers />
     <Faq />
     <Review />
    </div>
  );
}
