"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SquarePaymentForm, {
  CardState,
} from "@/components/square-payment-form/SquarePaymentForm";
import { useRef } from "react";

interface Course {
  course_id: string;
  name: string;
}

interface TutoringPackage {
  package_id: string;
  session_id: string;
  course_id: string;
  course_name: string;
  title: string;
  price: string;
  feature: string;
  is_most_popular: string | number;
  prev_session?: boolean;
}

interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  password?: string;
}

export default function BuyMoreSessionsClient() {
  const searchParams = useSearchParams();
  const user_id = searchParams.get("user_id") || "";
  const auth_token = searchParams.get("auth_token") || "";

  const [user, setUser] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [packagesMap, setPackagesMap] = useState<
    Record<string, TutoringPackage[]>
  >({});
  const [selectedPackage, setSelectedPackage] =
    useState<TutoringPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [cardState, setCardState] = useState<CardState>({
    initializing: true,
    paying: false,
    completed: false,
    message: null,
    paymentId: "",
    isCardValid: false,
  });
  const paymentRef = useRef<any>(null);

  const handlePaymentSubmit = async () => {
    if (paymentRef.current) {
      setIsPaying(true);
      try {
        await paymentRef.current.submitPayment();
      } catch (err) {
        console.error("Payment submission failed:", err);
      } finally {
        setIsPaying(false);
      }
    }
  };

  // Fetch Checkout Context (Imaginary API)
  useEffect(() => {
    if (!auth_token || !user_id) {
      setError("Missing auth_token or user_id in URL.");
      setLoading(false);
      return;
    }

    async function fetchContext() {
      setLoading(true);
      setApiError(null);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("action", "buy-more-sessions");
        params.append("user_id", user_id);
        params.append("auth_token", auth_token);

        const res = await fetch(process.env.NEXT_PUBLIC_PHP_API_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body: params.toString(),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setApiError(data.message || "Failed to load tutoring data.");
          return;
        }

        if (data.user) {
          setUser({ ...data.user, user_id });
        }

        // Use data.package_details as per API response
        const grouped = data.package_details || {};
        setPackagesMap(grouped);

        // Unique course names for the dropdown
        const courseNames = Object.values(grouped)
          .flat()
          .reduce((acc: Course[], pkg: any) => {
            if (!acc.find((c) => c.course_id === pkg.course_id)) {
              acc.push({ course_id: pkg.course_id, name: pkg.course_name });
            }
            return acc;
          }, []);
        setCourses(courseNames);

        // Auto-select based on prev_pkg flag in any of the packages
        let autoSelectedCourse = "";
        let autoSelectedPkg: TutoringPackage | null = null;

        Object.values(grouped)
          .flat()
          .forEach((pkg: any) => {
            if (pkg.prev_session) {
              autoSelectedCourse = pkg.course_id;
              autoSelectedPkg = pkg;
            }
          });

        if (autoSelectedCourse) {
          setSelectedCourseId(autoSelectedCourse);
          setSelectedPackage(autoSelectedPkg);
        }
      } catch (err) {
        setApiError(
          "A network error occurred. Please ensure you are connected and logged in.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchContext();
  }, [user_id, auth_token]);

  console.log(packagesMap);

  const packages = useMemo(() => {
    return Object.values(packagesMap)
      .flat()
      .filter((p) => p.course_id === selectedCourseId);
  }, [packagesMap, selectedCourseId]);

  const canShowPayment = useMemo(() => {
    return selectedPackage && selectedCourseId && user_id && auth_token && user;
  }, [selectedPackage, selectedCourseId, user_id, auth_token, user]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingCardStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ color: "#666" }}>Initializing secure checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerSection}>
          <div style={badgeStyle}>1-on-1 Tutoring</div>
          <h1 style={titleStyle}>Buy More Sessions</h1>
          <p style={subtitleStyle}>
            Choose your tutoring course and session bundle to proceed.
          </p>
          {user && (
            <div style={userInfoStyle}>
              User ID: <strong>{user_id}</strong>{" "}
              {user && `• ${user.first_name} ${user.last_name}`}
            </div>
          )}
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {apiError && (
          <div
            style={{
              ...errorStyle,
              backgroundColor: "#fff5f5",
              color: "#c53030",
            }}
          >
            {apiError}
          </div>
        )}
        {(!auth_token || !user_id) && !error && (
          <div style={errorStyle}>
            <strong>Authentication required:</strong> Missing{" "}
            {!user_id ? "user_id" : ""} {!user_id && !auth_token ? "and" : ""}{" "}
            {!auth_token ? "auth_token" : ""} in URL.
          </div>
        )}

        {/* Step 1: Course */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>1. Select Tutoring Course</label>
          <div style={selectWrapperStyle}>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedPackage(null);
              }}
              style={selectStyle}
              disabled={!auth_token}
            >
              <option value="" disabled>
                Choose a course...
              </option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div style={selectArrowStyle}>▼</div>
          </div>
        </div>

        {/* Step 2: Package (Always visible, disabled if no course) */}
        <div
          style={{
            ...formGroupStyle,
            opacity: selectedCourseId ? 1 : 0.5,
            pointerEvents: selectedCourseId ? "auto" : "none",
          }}
        >
          <label style={labelStyle}>2. Choose a package</label>
          <div style={packageGridStyle}>
            {packages.map((p) => {
              const isSelected =
                selectedPackage?.package_id === p.package_id &&
                selectedPackage?.session_id === p.session_id;
              return (
                <div
                  key={`${p.package_id}-${p.session_id}`}
                  onClick={() => setSelectedPackage(p)}
                  style={{
                    ...packageCardStyle,
                    borderColor: isSelected ? theme.secondary : "#dee2e6",
                    boxShadow: isSelected
                      ? "0 0 0 2px " + theme.secondary
                      : "none",
                  }}
                >
                  {String(p.is_most_popular) === "1" && (
                    <div style={popularBadgeStyle}>Popular</div>
                  )}
                  <div style={packageCardTitle}>{p.title}</div>
                  <div style={packageCardPrice}>${p.price}</div>
                  <div style={packageCardFeature}>{p.feature}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Payment (Always visible, disabled if no package) */}
        <div
          style={{
            ...paymentSectionStyle,
            opacity: selectedPackage ? 1 : 0.5,
            pointerEvents: selectedPackage ? "auto" : "none",
          }}
        >
          <div style={paymentHeader}>
            <h2 style={sectionTitleStyle}>Secure Checkout</h2>
            <p style={paymentNote}>
              One-time payment. Pay securely via Square.
            </p>
          </div>
          <div style={paymentWrapperStyle}>
            {canShowPayment ? (
              <>
                <SquarePaymentForm
                  ref={paymentRef}
                  amount={Math.round(parseFloat(selectedPackage!.price) * 100)}
                  course_id={selectedPackage!.course_id}
                  session_id={selectedPackage!.session_id}
                  package_id={selectedPackage!.package_id}
                  user={user as any}
                  mode="one_time"
                  isExistingUser={true}
                  onPaymentSuccess={(pid) => {
                    const pkgId = selectedPackage?.package_id || "";
                    let q = pid
                      ? `?method=card&id=${encodeURIComponent(pid)}`
                      : `?method=card`;
                    if (pkgId) {
                      q += `&package_id=${pkgId}`;
                    }
                    q += `&buy_more=1`;
                    window.location.href = `/thank-you${q}`;
                  }}
                  onStateChange={setCardState}
                />
                {cardState.message && (
                  <div
                    style={{
                      ...errorStyle,
                      backgroundColor: cardState.completed
                        ? "#e6fffa"
                        : "#fff5f5",
                      borderColor: cardState.completed ? "#319795" : "#feb2b2",
                      color: cardState.completed ? "#234e52" : "#9b2c2c",
                      marginTop: "15px",
                      marginBottom: "0px",
                    }}
                  >
                    {cardState.message}
                  </div>
                )}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={
                      isPaying ||
                      cardState.initializing ||
                      cardState.paying ||
                      cardState.completed ||
                      !cardState.isCardValid
                    }
                    style={{
                      ...submitButtonStyle,
                      opacity:
                        isPaying ||
                        cardState.initializing ||
                        cardState.paying ||
                        cardState.completed ||
                        !cardState.isCardValid
                          ? 0.7
                          : 1,
                      cursor:
                        isPaying ||
                        cardState.initializing ||
                        cardState.paying ||
                        cardState.completed ||
                        !cardState.isCardValid
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {cardState.paying || isPaying
                      ? "Processing..."
                      : cardState.completed
                        ? "Payment Completed"
                        : `Pay $${parseFloat(selectedPackage!.price).toFixed(2)} Now`}
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#999",
                  border: "1px dashed #ddd",
                  borderRadius: "8px",
                }}
              >
                Please select a course and bundle to enable payment.
              </div>
            )}
          </div>
          <div style={securityBadgeStyle}>🔒 Secure SSL Encrypted Checkout</div>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const theme = {
  primary: "#f2a155",
  secondary: "#002341",
  primaryDark: "#e58a34",
  background: "#ffffff",
  text: "#1a1a1a",
  muted: "#666",
  border: "#dee2e6",
};

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8f9fa",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 15px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: theme.background,
  borderRadius: "1rem",
  padding: "40px",
  width: "100%",
  maxWidth: "900px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  border: "none",
};

const loadingCardStyle: React.CSSProperties = {
  background: "#fff",
  padding: "3rem",
  borderRadius: "1rem",
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const spinnerStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  border: "3px solid #f3f3f3",
  borderTop: `3px solid ${theme.primary}`,
  borderRadius: "50%",
  margin: "0 auto 1rem",
  animation: "spin 1s linear infinite",
};

const headerSection: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "30px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "4px",
  background: theme.secondary,
  color: "#fff",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "10px",
  color: theme.secondary,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "16px",
  color: theme.muted,
  marginBottom: "15px",
  lineHeight: "1.5",
};

const userInfoStyle: React.CSSProperties = {
  fontSize: "14px",
  color: theme.muted,
  background: "#f1f3f5",
  padding: "8px 16px",
  borderRadius: "8px",
  display: "inline-block",
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: "25px",
  transition: "opacity 0.3s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: "bold",
  marginBottom: "8px",
  color: theme.secondary,
};

const selectWrapperStyle: React.CSSProperties = {
  position: "relative",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 15px",
  fontSize: "16px",
  borderRadius: "0.5rem",
  border: `1px solid ${theme.border}`,
  backgroundColor: "#fff",
  appearance: "none",
  cursor: "pointer",
  transition: "border-color 0.2s",
  outline: "none",
  color: theme.text,
};

const selectArrowStyle: React.CSSProperties = {
  position: "absolute",
  right: "15px",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#999",
  fontSize: "12px",
};

const packageDetailCard: React.CSSProperties = {
  marginTop: "15px",
  padding: "15px",
  borderRadius: "8px",
  background: "#fff9f4",
  border: `1px solid ${theme.primary}`,
};

const packageSummaryHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "5px",
};

const packageDetailTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: theme.secondary,
};

const packageDetailPrice: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
  color: theme.primaryDark,
};

const packageDetailFeature: React.CSSProperties = {
  fontSize: "14px",
  color: theme.text,
  marginBottom: "4px",
};

const packageDetailSubFeature: React.CSSProperties = {
  fontSize: "13px",
  color: theme.muted,
  fontStyle: "italic",
};

const paymentSectionStyle: React.CSSProperties = {
  marginTop: "30px",
  paddingTop: "20px",
  borderTop: `1px solid ${theme.border}`,
  transition: "opacity 0.3s ease",
};

const paymentHeader: React.CSSProperties = {
  marginBottom: "15px",
  textAlign: "center",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "5px",
  color: theme.secondary,
};

const paymentNote: React.CSSProperties = {
  fontSize: "14px",
  color: theme.muted,
};

const paymentWrapperStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "0.5rem",
  padding: "15px",
  border: `1px solid ${theme.border}`,
};

const securityBadgeStyle: React.CSSProperties = {
  textAlign: "center",
  marginTop: "15px",
  fontSize: "12px",
  color: "#999",
};

const errorStyle: React.CSSProperties = {
  backgroundColor: "#f8d7da",
  color: "#721c24",
  padding: "12px 15px",
  borderRadius: "0.5rem",
  marginBottom: "20px",
  border: "1px solid #f5c6cb",
  fontSize: "14px",
};

const loadingText: React.CSSProperties = {
  color: theme.primaryDark,
  fontSize: "14px",
  fontWeight: "bold",
  padding: "5px 0",
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: theme.primary,
  color: "#fff",
  padding: "12px 30px",
  fontSize: "16px",
  fontWeight: "bold",
  border: "none",
  borderRadius: "0.5rem",
  transition: "background-color 0.2s",
  width: "100%",
  boxShadow: "0 4px 6px rgba(242, 161, 85, 0.2)",
};

const packageGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
  marginTop: "1rem",
};

const packageCardStyle: React.CSSProperties = {
  position: "relative",
  padding: "1.5rem",
  borderRadius: "12px",
  border: "1px solid #dee2e6",
  backgroundColor: "#fff",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const popularBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  backgroundColor: "#f8f9fa",
  color: "#1a1a1a",
  padding: "2px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid #dee2e6",
};

const packageCardTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  color: theme.secondary,
  paddingRight: "60px", // space for popular badge
};

const packageCardPrice: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: theme.text,
};

const packageCardFeature: React.CSSProperties = {
  fontSize: "14px",
  color: theme.muted,
  whiteSpace: "pre-wrap",
};
