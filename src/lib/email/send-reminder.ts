import "server-only";
import { getResendClient, EMAIL_FROM } from "./resend";

export async function sendReminderEmail(email: string, name: string) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;

  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Don't forget to log today's spending",
    html: `
      <p>Hi ${name},</p>
      <p>This is your daily reminder to log today's transactions in Budget Tracker.</p>
      <p><a href="${dashboardUrl}">Open Budget Tracker</a></p>
      <p>You can change or turn off this reminder anytime in Settings.</p>
    `,
  });
}
