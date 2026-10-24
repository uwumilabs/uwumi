/**
 * Admin Configuration
 * This file contains all admin-related configurations including
 * admin users, routes, permissions, and dashboard settings
 */

export const ADMIN_CONFIG = {
  /**
   * Admin user emails - Users with these emails will have admin access
   * Add your admin email addresses here
   */
  ADMIN_EMAILS: [
    "admin@uwumi.app",
    "durgeshdwivedi81@gmail.com",
    // Add more admin emails here
  ],

  /**
   * Admin user IDs - Specific Clerk user IDs that should have admin access
   * This is useful for users who might change their email but should retain admin access
   */
  ADMIN_USER_IDS: [
    // Add specific Clerk user IDs here
    // Example: "user_2N1234567890abcdef",
  ],

  /**
   * Admin routes that require authentication
   */
  ADMIN_ROUTES: [
    "/admin",
    "/admin/dashboard",
    "/admin/content",
    "/admin/users",
    "/admin/settings",
  ],

  /**
   * Admin permissions and roles
   */
  PERMISSIONS: {
    SUPER_ADMIN: "super_admin",
    CONTENT_MANAGER: "content_manager",
    USER_MANAGER: "user_manager",
    ANALYTICS_VIEWER: "analytics_viewer",
  },
};
export default ADMIN_CONFIG;
