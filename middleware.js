// middleware.js
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

                                             
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("authToken")?.value;

                                               
    if (!token) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],                
};
