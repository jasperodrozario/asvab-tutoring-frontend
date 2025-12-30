import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container py-5">Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
