import { useEffect, useState } from "react";
import DashboardHome from "./components/DashboardHome.jsx";
import LoginPage from "./components/LoginPage.jsx";
import users from "./data/users.json";
import { clearSession, createSession, getSessionTimeLeft, readSession, saveSession } from "./utils/auth.js";

function App() {
  const [session, setSession] = useState(() => readSession());
  const [expiredMessage, setExpiredMessage] = useState("");

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearSession();
      setSession(null);
      setExpiredMessage("Tu sesión expiró después de 1 hora. Inicia sesión nuevamente.");
    }, getSessionTimeLeft(session));

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  function handleLogin(credentials) {
    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() === credentials.email.trim().toLowerCase() &&
        user.password === credentials.password
    );

    if (!foundUser) {
      return {
        ok: false,
        message: "Correo o contraseña incorrectos."
      };
    }

    const nextSession = createSession(foundUser);
    saveSession(nextSession);
    setExpiredMessage("");
    setSession(nextSession);

    return { ok: true };
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setExpiredMessage("");
  }

  if (!session) {
    return <LoginPage expiredMessage={expiredMessage} onLogin={handleLogin} />;
  }

  return <DashboardHome user={session.user} onLogout={handleLogout} />;
}

export default App;
