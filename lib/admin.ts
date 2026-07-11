export const ADMIN_EMAIL = "viktorm@findatashield.com";
export const ADMIN_PLAN_NAME = "Admin — Unlimited";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
