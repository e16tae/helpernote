import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 인증이 필요한 경로들
const protectedPaths = ["/dashboard"];

// 인증된 사용자가 접근할 수 없는 경로들 (로그인/회원가입)
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // 대시보드 경로 접근 시 인증 체크
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 로그인/회원가입 페이지는 인증된 사용자 접근 방지
  const isAuthPath = authPaths.some((path) => pathname === path);

  if (isAuthPath && token) {
    // 이미 로그인한 사용자는 대시보드로 리다이렉트
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
