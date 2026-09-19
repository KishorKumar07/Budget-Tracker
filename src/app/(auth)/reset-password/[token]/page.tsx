import { ResetPasswordForm } from "./reset-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({
  params,
}: PageProps<"/reset-password/[token]">) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} />
      </CardContent>
    </Card>
  );
}
