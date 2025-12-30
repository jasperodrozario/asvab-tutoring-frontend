"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import SquarePaymentForm from "@/components/square-payment-form/SquarePaymentForm";

export default function CheckoutContent() {
  const searchParams = useSearchParams();

  const course_id = searchParams.get("course_id") || "";
  const session_id = searchParams.get("session_id") || "";

  // URL amount is dollars like 75.00
  const amountDollars = Number(searchParams.get("amount") || 0);
  const amountCents = Math.round(amountDollars * 100);

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const invalid =
    !course_id || !session_id || !Number.isFinite(amountDollars) || amountCents <= 0;

  if (invalid) {
    return <p className="text-danger">Invalid checkout link.</p>;
  }

  return (
    <div className="container py-5">
      <h1 className="mb-3">Checkout</h1>

      <p className="fs-5">
        <strong>Total:</strong> ${amountDollars.toFixed(2)}
      </p>

      {/* Registration fields (required by your PHP API) */}
      <input className="form-control mb-2" name="first_name" placeholder="First Name" onChange={handleChange} />
      <input className="form-control mb-2" name="last_name" placeholder="Last Name" onChange={handleChange} />
      <input className="form-control mb-2" type="email" name="email" placeholder="Email" onChange={handleChange} />
      <input className="form-control mb-2" name="mobile" placeholder="Mobile" onChange={handleChange} />
      <input className="form-control mb-3" type="password" name="password" placeholder="Password" onChange={handleChange} />

      <SquarePaymentForm
        amount={amountCents}
        course_id={course_id}
        session_id={session_id}
        user={user}
      />
    </div>
  );
}
