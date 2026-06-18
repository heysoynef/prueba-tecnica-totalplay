const SESSION_KEY = "bookPortalSession";
const ONE_HOUR_MS = 60 * 60 * 1000;

function toBase64Url(value) {
  return btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return JSON.parse(atob(padded));
}

export function createSession(user) {
  const now = Date.now();
  const expiresAt = now + ONE_HOUR_MS;
  const token = [
    toBase64Url({ alg: "HS256", typ: "JWT" }),
    toBase64Url({
      sub: user.id,
      name: user.name,
      email: user.email,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000)
    }),
    "demo-signature"
  ].join(".");

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    expiresAt
  };
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function readSession() {
  const rawSession = localStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);
    const payload = decodeToken(session.token);

    if (!session.expiresAt || session.expiresAt <= Date.now() || payload.exp * 1000 <= Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function decodeToken(token) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Token invalido");
  }

  return fromBase64Url(payload);
}

export function getSessionTimeLeft(session) {
  return Math.max(0, session.expiresAt - Date.now());
}
