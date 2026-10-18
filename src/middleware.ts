import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

/**
 * Do not skip `/uploads/...` image paths — catalog photos require a session.
 * Static Next assets and favicon stay public; other `*.png`/`*.jpg` under app
 * routes still go through `authorized` (login redirect).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
