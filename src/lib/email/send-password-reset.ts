import "server-only";
import { getResendClient, EMAIL_FROM } from "./resend";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your Budget Tracker password",
    html: `
      <p>We received a request to reset your Budget Tracker password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}
