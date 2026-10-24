import { UserResource } from "@clerk/types";
import { ADMIN_CONFIG } from "../config/admin";

/**
 * Check if a user is an admin based on email or user ID
 */
export function isUserAdmin(user: UserResource | null): boolean {
  if (!user) return false;

  // Check by email
  const userEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (userEmail && ADMIN_CONFIG.ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }

  // Check by user ID
  if (ADMIN_CONFIG.ADMIN_USER_IDS.includes(user.id)) {
    return true;
  }

  // Check by metadata (if using Clerk roles)
  const hasAdminRole = user.publicMetadata?.role === "admin";

  return Boolean(hasAdminRole);
}

/**
 * Get user's primary email address
 */
export function getUserEmail(user: UserResource | null): string | null {
  if (!user) return null;

  return (
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress || null
  );
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user: UserResource | null): string {
  if (!user) return "User";

  if (user.fullName) return user.fullName;
  if (user.firstName) return user.firstName;

  const email = getUserEmail(user);
  return email || "User";
}

/**
 * Get user's initials for avatar
 */
export function getUserInitials(user: UserResource | null): string {
  if (!user) return "U";

  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(
      0
    )}`.toUpperCase();
  }

  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }

  const email = getUserEmail(user);
  return email ? email.charAt(0).toUpperCase() : "U";
}

/**
 * Check if current route is an admin route
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_CONFIG.ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
