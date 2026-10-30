import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { login } from "../lib/endpoints";

export function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState("ana@orbita.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { token } = await login(email, password);
      auth.login(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="centered-page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h1>Orbita</h1>
        <p className="muted">Inicia sesión para ver tu saldo.</p>

        {auth.sessionMessage && <div className="banner banner-warning">{auth.sessionMessage}</div>}
        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
