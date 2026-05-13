import { type NextRequest, NextResponse } from "next/server";
import { getProfileForUser } from "@/lib/auth/profile";
import { canAccessAdmin, canAccessAgentDashboard } from "@/lib/rbac";
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
  const isAgentRoute = request.nextUrl.pathname === "/agent" || request.nextUrl.pathname.startsWith("/agent/");
  const isUserProtectedRoute =
    request.nextUrl.pathname === "/dashboard" ||
    request.nextUrl.pathname === "/favorites" ||
    request.nextUrl.pathname === "/saved";
  const isProtectedRoute = isAdminRoute || isAdminApiRoute || isAgentRoute || isUserProtectedRoute;

  const { response, supabase, error } = await updateSupabaseSession(request);

  if (!supabase) {
    if (!isProtectedRoute) {
      return response;
    }

    if (isAdminApiRoute) {
      return NextResponse.json(
        { error: error?.message ?? "Authentication service unavailable" },
        { status: 503 }
      );
    }

    return redirectToLogin(request);
  }

  let user = null;

  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    if (!isProtectedRoute) {
      return response;
    }

    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
    }

    return redirectToLogin(request);
  }

  if (isUserProtectedRoute && !user) {
    return redirectToLogin(request);
  }

  if (!isAdminRoute && !isAdminApiRoute && !isAgentRoute) {
    return response;
  }

  if (!user) {
    if (isAdminApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return redirectToLogin(request);
  }

  let profile = null;
  try {
    profile = await getProfileForUser(supabase, user);
  } catch {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unable to verify profile permissions" }, { status: 503 });
    }

    if (isProtectedRoute) {
      return redirectToLogin(request);
    }

    return response;
  }

  if ((isAdminRoute || isAdminApiRoute) && !canAccessAdmin(profile?.role)) {
    if (isAdminApiRoute) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAgentRoute && !canAccessAgentDashboard(profile?.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
