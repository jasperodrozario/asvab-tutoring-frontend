/**
 * Sanitizes mobile input to digits only (max 10).
 * Returns null when the change should be ignored — e.g. typing another digit
 * while already at max length — so the controlled input keeps cursor position.
 */
export function sanitizeMobileInput(
  rawValue: string,
  previousValue: string,
): string | null {
  const cleaned = rawValue.replace(/\D/g, "");
  const prev = previousValue.replace(/\D/g, "");

  if (prev.length >= 10 && cleaned.length > prev.length) {
    return null;
  }

  return cleaned.slice(0, 10);
}

/** Registration uses a 10-digit US number, without the country code. */
export function validateRegistrationMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (!digits) return "Mobile number is required.";
  if (digits.length !== 10) return "Enter a valid 10-digit US number.";
  if (/^(\d)\1{9}$/.test(digits)) return "Enter a valid US number.";
  if (digits[0] === "0" || digits[0] === "1")
    return "Area code cannot start with 0 or 1.";
  if (digits[3] === "0" || digits[3] === "1")
    return "Exchange code cannot start with 0 or 1.";
  return "";
}
