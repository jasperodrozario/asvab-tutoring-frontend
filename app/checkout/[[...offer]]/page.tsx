"use client";

import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";
import { useParams } from "next/navigation";
import OfferCheckout from "./OfferCheckout";

export default function CheckoutPage() {
  const params = useParams();

  // Extract the offer slug from the URL
  // This will be "summer-deal" if the URL is /checkout/summer-deal
  const offerSlug = Array.isArray(params.offer)
    ? params.offer[0]
    : params.offer;

  // If there is an offer slug, show the special offer checkout
  if (offerSlug === "limited-time-offer") {
    return (
      <Suspense
        fallback={
          <div className="container py-5 text-center text-muted">
            Loading special offer checkout...
          </div>
        }
      >
        <OfferCheckout />
      </Suspense>
    );
  }

  // Otherwise, show the regular checkout
  return (
    <Suspense
      fallback={<div className="container py-5">Loading checkout…</div>}
    >
      <CheckoutContent />
    </Suspense>
  );
}
