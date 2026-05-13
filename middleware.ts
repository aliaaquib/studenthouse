import { type NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/");
  const isAdminApiRoute = request.nextUrl.pathname.startsWith("/api/admin/");
  const isUserProtectedRoute =
    request.nextUrl.pathname === "/dashboard" ||
    request.nextUrl.pathname === "/favorites" ||
    request.nextUrl.pathname === "/saved";

  const { response, supabase } = await updateSupabaseSession(request);

  if (!supabase) return response;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isUserProtectedRoute && !user) {
    return redirectToLogin(request);
  }

  if (!isAdminRoute && !isAdminApiRoute) {
    return response;
  }

  if (!user) {
    if (isAdminApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return redirectToLogin(request);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    if (isAdminApiRoute) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
