"use client";

import { useSearchParams } from "next/navigation";
import SquarePaymentForm from "@/components/square-payment-form/SquarePaymentForm";

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const rawAmountString = searchParams.get("amount");
  const rawAmount = rawAmountString ? Number(rawAmountString) : 0;

  const displayAmount = (rawAmount / 100).toFixed(2);

  return (
    <div className="container py-5">
      <h1 className="mb-3">Checkout</h1>

      <p className="fs-5">
        <strong>Total:</strong> ${displayAmount}
      </p>

      {rawAmount <= 0 ? (
        <p className="text-danger">Invalid amount</p>
      ) : (
        <SquarePaymentForm amount={rawAmount} />
      )}
    </div>
  );
}
