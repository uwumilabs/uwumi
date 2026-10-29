import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Get auth info
    const authInfo = await auth();

    // Check if user is signed in
    if (!authInfo.userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // For admin-only access, you can uncomment and customize this:
    // Note: This requires importing clerkClient and may impact performance
    // For better performance, consider checking admin status in the page component

    /*
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const user = await client.users.getUser(authInfo.userId);
      
      // Check admin emails
      const adminEmails = ["admin@uwumi.com"]; // Add your admin emails
      const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
      
      if (!adminEmails.includes(userEmail || "")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("Admin check failed:", error);
      return NextResponse.redirect(new URL("/", req.url));
    }
    */
  }
});

export const config = {
  // Only routes that need a session run Clerk. Public pages (/, /info) read the user client-side, so a visitor
  // is never bounced through Clerk's handshake to see them, and a Clerk outage or bad key can't 500 them.
  // /__clerk is Clerk's auto-proxy on *.vercel.app.
  matcher: ["/admin/:path*", "/sign-in/:path*", "/sign-up/:path*", "/(api|trpc)(.*)", "/__clerk/:path*"],
};
