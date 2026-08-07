import Image from "next/image";
import IntroText from "../intro-text/IntroText";
import NoticeContent from "@/components/notice-content/NoticeContent";
import HeroPromoVideo from "./HeroPromoVideo";
import TutorRequestForm from "./TutorRequestForm";
import type { ContentBlock, NoticeItem, StateOption } from "@/lib/php-api";

type Props = {
  initialStates?: StateOption[];
  initialWelcome?: ContentBlock | null;
  initialNotices?: NoticeItem[];
};

export default function Welcome({
  initialStates = [],
  initialWelcome = null,
  initialNotices = [],
}: Props) {
  return (
    <>
      {/* Hero Section — static shell is a Server Component for faster first paint */}
      <div className="min-vh-100 d-flex align-items-lg-center align-items-start bg-hero text-white py-5 px-3">
        <Image
          src="/images/asvab-bg.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="bg-hero-image"
          quality={70}
        />
        <div className="container hero-content">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center">
              <h1 className="display-5 fw-bold">
                Welcome To <br />
                <span className="primary-color-custom">ASVAB Tutoring</span>
              </h1>

              <p className="lead mt-3">
                11,000+ successful candidates. Online Test Prep for the ASVAB,
                ASTB, OAR, AFOQT, and SIFT
              </p>

              <HeroPromoVideo />
            </div>

            <div className="col-lg-6">
              <TutorRequestForm initialStates={initialStates} />
            </div>
          </div>
        </div>
      </div>

      <NoticeContent initialNotices={initialNotices} />

      <IntroText initialWelcome={initialWelcome} />
    </>
  );
}
