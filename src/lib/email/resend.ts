import { Resend } from "resend";

let resendClient: Resend | undefined;

// Constructed lazily: the Resend SDK throws at instantiation if the API
// key is missing, and this module is imported transitively by the auth
// Server Actions. A missing key must only break password-reset emails,
// not the entire auth module graph (which would break login too).
export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to .env to send emails."
    );
  }

  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Budget Tracker <onboarding@resend.dev>";
