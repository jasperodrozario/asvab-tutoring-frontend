"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface FAQ {
  id: string;
  question: string;
  answers: string;
}

export default function Faq() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js"); // Enable accordion

    const fetchFaqs = async () => {
      const formData = new FormData();
      formData.append("action", "get-faq");

      try {
        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data?.status === 200 && Array.isArray(data.data)) {
          setFaqs(data.data);
        } else {
          console.error(data?.message || "Failed to fetch FAQs");
        }
      } catch (err) {
        console.error("Error fetching FAQs:", err);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <section id="faqs" className="mb-4 px-3 bg-[#f8f9fa] ">
      <div className="container">
        {/* Title */}
        <div className="text-center mb-4 position-relative">
          <h2
            className="fw-bold display-6 d-inline-block pb-3 position-relative text-dark"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
          >
            Frequently Asked Questions
            <img
              src="/images/border_v1.png"
              alt="underline"
              width={160}
              height={8}
              className="position-absolute start-50 translate-middle-x bottom-0"
              style={{ height: "8px", width: "160px", objectFit: "cover" }}
            />
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="accordion" id="faqAccordion">
          {faqs.length === 0 ? (
            <p className="text-center  ">No FAQs available.</p>
          ) : (
            faqs.map((faq, index) => (
              <div className="accordion-item border shadow-sm" key={faq.id}>
                <h2 className="accordion-header" id={`heading${faq.id}`}>
                  <button
                    className={`accordion-button custom-bg ${
                      index !== 0 ? "collapsed" : ""
                    }`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${faq.id}`}
                    aria-expanded={index === 0 ? "true" : "false"}
                    aria-controls={`collapse${faq.id}`}
                  >
                    {faq.question}
                    <i className="bi bi-chevron-up icon-up accordion-icon ms-auto" />
                    <i className="bi bi-chevron-down icon-down accordion-icon ms-auto" />
                  </button>
                </h2>
                <div
                  id={`collapse${faq.id}`}
                  className={`accordion-collapse collapse ${
                    index === 0 ? "show" : ""
                  }`}
                  aria-labelledby={`heading${faq.id}`}
                  data-bs-parent="#faqAccordion"
                >
                  {/* ✅ Render HTML content from API */}
                  <div
                    className="accordion-body small  "
                    dangerouslySetInnerHTML={{
                      __html: faq.answers || "No answer available.",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
