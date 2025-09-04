// middleware.js
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // הרשימה המוגנת: כל מה שמתחיל ב-/dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("authToken")?.value;

    // אם אין טוקן (משתמש לא מחובר) -> Redirect
    if (!token) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // דפוסים להגנה
};
