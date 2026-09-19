import type { NextAuthConfig } from "next-auth";

// Edge/proxy-safe config: no Prisma, no bcrypt. Used by proxy.ts for
// lightweight route gating only. The authoritative check on every
// mutation still happens in requireAuth() inside the Server Action itself.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPages =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register") ||
        request.nextUrl.pathname.startsWith("/forgot-password") ||
        request.nextUrl.pathname.startsWith("/reset-password");

      if (isOnAuthPages) {
        return true;
      }

      return isLoggedIn;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};
