import React from "react";
import Faq from "@/components/faq/Faq";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export const metadata = {
  title: "FAQ | ASVAB Tutoring",
  description:
    "Find answers to frequently asked questions about ASVAB Tutoring’s services, pricing, and features.",
};

export default function FaqPage() {
  return (
    <section className="bg-light">
      {/* ✅ Banner Section */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">
          FAQ
        </h1>
        <Breadcrumb
          segments={["faq"]}
          className="text-white text-base mt-1"
        />
      </div>

      {/* ✅ FAQ Section */}
      <main>
        <Faq />
      </main>
    </section>
  );
}
