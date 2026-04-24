export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|setup|register|api/auth|api/setup|api/register|_next/static|_next/image|favicon.ico).*)",
  ],
};
