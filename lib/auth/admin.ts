import { cookies } from "next/headers";

export const ADMIN_AUTH_COOKIE = "jogger_admin_auth";

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value === "authenticated";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}

export function isValidAdminPassword(password: string): boolean {
  return password.trim().length > 0 && password.trim() === getAdminPassword();
}

function cookieOptions(request: Request) {
  // See lib/auth/executive.ts for why we don't trust x-forwarded-proto here.
  const isSecure = new URL(request.url).protocol === "https:";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  };
}

export async function setAdminAuthCookie(request: Request): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE, "authenticated", cookieOptions(request));
}

export async function clearAdminAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
}
