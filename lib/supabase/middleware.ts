import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // Subdomain routing: cert-os.nl = marketing, app.cert-os.nl = app
  const host = request.headers.get("host") ?? "";
  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");
  const isAppDomain = isLocalDev || host.startsWith("app.");

  if (!isAppDomain) {
    // Marketing domain: pass through /, auth/*, api/*, static, legal pages
    const marketingPassPaths = [
      "/auth/", "/api/", "/_next/",
      "/privacy", "/voorwaarden", "/verwerkersovereenkomst", "/cookies",
    ];
    if (path === "/" || marketingPassPaths.some(p => path.startsWith(p))) {
      return supabaseResponse;
    }
    // All other paths (e.g. /dashboard) → redirect to app.cert-os.nl
    const appUrl = request.nextUrl.clone();
    appUrl.host = "app.cert-os.nl";
    return NextResponse.redirect(appUrl);
  }

  // App domain: run auth logic
  const { data: { user } } = await supabase.auth.getUser();

  // Publieke routes — geen auth vereist
  const publicPaths = ["/auth/login", "/auth/callback", "/auth/error"];
  if (publicPaths.some(p => path === p || path.startsWith("/auth/"))) {
    return supabaseResponse;
  }

  // Niet ingelogd → login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  // Rol ophalen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("global_role")
    .eq("user_id", user.id)
    .single();

  const role = profile?.global_role;

  // Client → alleen /portal
  if (role === "client" && !path.startsWith("/portal")) {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = "/portal";
    return NextResponse.redirect(portalUrl);
  }

  // Coordinator → niet /portal
  if (role === "coordinator" && path.startsWith("/portal")) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}
