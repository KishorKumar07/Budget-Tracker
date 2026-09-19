import "server-only";
import { getResendClient, EMAIL_FROM } from "./resend";

export async function sendInvitationEmail(
  email: string,
  token: string,
  workspaceName: string,
  inviterName: string
) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on Budget Tracker`,
    html: `
      <p>${inviterName} invited you to join <strong>${workspaceName}</strong> on Budget Tracker.</p>
      <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
      <p>This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
    `,
  });
}
