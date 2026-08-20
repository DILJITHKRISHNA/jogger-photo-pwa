import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Lightweight "keep it simple" executive gate, matching the spec's
 * Employee ID + password option. It personalizes the app and keeps the
 * admin panel out of executives' hands — swap in real OTP/SSO later
 * without touching the rest of the app (see README).
 */
export const EXEC_AUTH_COOKIE = "jogger_exec_session";

export interface ExecutiveSession {
  employeeId: string;
  name: string;
  loginAt: string;
}

export function getExecutiveAccessCode(): string {
  return process.env.EXEC_ACCESS_CODE ?? "jogger2026";
}

export function isValidExecutiveAccessCode(code: string): boolean {
  return code.trim().length > 0 && code.trim() === getExecutiveAccessCode();
}

function cookieOptions(request: Request) {
  // Deriving `secure` from x-forwarded-proto is unreliable behind preview
  // proxies that terminate TLS upstream while the browser itself is on
  // plain http — that mismatch makes the browser silently refuse to store
  // the cookie. The request's own URL is what the browser actually used.
  const isSecure = new URL(request.url).protocol === "https:";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days — executives should "stay logged in"
  };
}

export async function setExecutiveSessionCookie(
  request: Request,
  session: Omit<ExecutiveSession, "loginAt">
): Promise<void> {
  const cookieStore = await cookies();
  const value: ExecutiveSession = { ...session, loginAt: new Date().toISOString() };
  cookieStore.set(
    EXEC_AUTH_COOKIE,
    Buffer.from(JSON.stringify(value)).toString("base64url"),
    cookieOptions(request)
  );
}

export async function getExecutiveSession(): Promise<ExecutiveSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(EXEC_AUTH_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as ExecutiveSession;
    if (!parsed.employeeId || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearExecutiveSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(EXEC_AUTH_COOKIE);
}

/**
 * For use at the top of executive Server Component pages: returns the
 * session, or redirects to /login. The (exec) layout already guards these
 * routes — this is a defensive second check so a page never crashes on a
 * null session instead of just bouncing the visitor to sign in.
 */
export async function requireExecutiveSession(): Promise<ExecutiveSession> {
  const session = await getExecutiveSession();
  if (!session) redirect("/login");
  return session;
}
