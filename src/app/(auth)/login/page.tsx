import Link from "next/link";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const resolvedCallbackUrl = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm callbackUrl={resolvedCallbackUrl} />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
