import React from "react";
import TopCourses from "@/components/topcourses/Topcourses";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export const metadata = {
  title: "Services | ASVAB Tutoring",
  description:
    "Explore the wide range of ASVAB Tutoring services and courses we offer to help you prepare effectively.",
};

export default function ServicesPage() {
  return (
    <section className="bg-light">
      {/* ✅ Banner with title + breadcrumb */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">Our Services</h1>
        <Breadcrumb segments={["services"]} className="text-white text-base mt-1" />
      </div>

      {/* ✅ Reuse TopCourses component */}
      <main>
        <TopCourses />
      </main>
    </section>
  );
}
