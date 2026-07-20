import { NextResponse, type NextRequest } from "next/server";

const productionHiddenRoutes = ["/dashboard/funding", "/dashboard/new", "/dashboard/project"];

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && productionHiddenRoutes.some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
