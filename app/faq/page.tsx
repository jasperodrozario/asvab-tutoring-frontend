import React from "react";
import type { Metadata } from "next";
import Faq from "@/components/faq/Faq";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import { faqMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = faqMetadata();

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
