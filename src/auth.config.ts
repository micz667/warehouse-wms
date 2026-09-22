import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isPublic =
        pathname.startsWith("/login") || pathname.startsWith("/api/auth");

      if (isPublic) {
        if (isLoggedIn && pathname.startsWith("/login")) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/api/")) {
        // API routes enforce auth themselves (401/403 JSON).
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") {
          session.user.id = token.id;
        }
        if (
          token.role === "magazynier" ||
          token.role === "architekt" ||
          token.role === "admin"
        ) {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
