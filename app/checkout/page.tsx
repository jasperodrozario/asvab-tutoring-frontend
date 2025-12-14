import { Suspense } from "react";
import CheckoutContent from "./CheckoutContent";

export default function CheckoutPageWrapper() {
  return (
    <Suspense fallback={<div className="container py-5">Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
