import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 renamed middleware.ts -> proxy.ts and it now runs on the
// Node.js runtime only. This is UX-level route gating (redirect to /login);
// it is not the security boundary. Every Server Action re-verifies the
// session itself via requireAuth() — see src/lib/auth/guards.ts.
export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
