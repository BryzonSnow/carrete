const guestKey = (slug: string) => `carrete.guest.${slug}`;
const adminKey = (slug: string) => `carrete.admin.${slug}`;

function cookieSet(name: string, value: string) {
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  document.cookie = `${safe}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

function cookieGet(name: string) {
  if (typeof document === "undefined") return "";
  const safe = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const hit = document.cookie.split("; ").find((c) => c.startsWith(safe + "="));
  return hit ? decodeURIComponent(hit.split("=").slice(1).join("=")) : "";
}

export function getGuestToken(slug: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(guestKey(slug)) || cookieGet(`carrete_g_${slug}`) || "";
}

export function setGuestToken(slug: string, token: string) {
  localStorage.setItem(guestKey(slug), token);
  cookieSet(`carrete_g_${slug}`, token);
}

export function getAdminToken(slug: string) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(adminKey(slug)) || "";
}

export function setAdminToken(slug: string, token: string) {
  localStorage.setItem(adminKey(slug), token);
}
