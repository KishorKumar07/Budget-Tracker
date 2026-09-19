import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getInvitationByToken } from "@/server/services/invitation-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInvitationForm } from "./accept-invitation-form";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const session = await auth();

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <InviteMessage title="Invitation not found">
        This invitation link is invalid.
      </InviteMessage>
    );
  }

  if (invitation.status === "EXPIRED") {
    return (
      <InviteMessage title="Invitation expired">
        This invitation has expired. Ask the workspace owner to send a new one.
      </InviteMessage>
    );
  }

  if (invitation.status === "REVOKED") {
    return (
      <InviteMessage title="Invitation revoked">
        This invitation is no longer valid.
      </InviteMessage>
    );
  }

  if (invitation.status === "ACCEPTED") {
    return (
      <InviteMessage title="Already accepted">
        This invitation has already been accepted.
      </InviteMessage>
    );
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const emailMismatch = session.user.email !== invitation.email;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">You&apos;re invited</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{invitation.invitedBy.name}</strong>{" "}
          invited you to join{" "}
          <strong className="text-foreground">{invitation.workspace.name}</strong> with{" "}
          {invitation.permissions.length} permissions.
        </p>

        {emailMismatch ? (
          <p className="text-sm text-destructive">
            This invitation was sent to {invitation.email}, but you&apos;re signed in as{" "}
            {session.user.email}. Sign in with the invited email to accept.
          </p>
        ) : (
          <AcceptInvitationForm token={token} />
        )}
      </CardContent>
    </Card>
  );
}

function InviteMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{children}</p>
        <Link href="/dashboard" className={buttonVariants({ className: "w-fit" })}>
          Go to dashboard
        </Link>
      </CardContent>
    </Card>
  );
}
