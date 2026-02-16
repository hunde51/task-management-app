import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: 16 },
  card: { maxWidth: 400, width: "100%", background: "white", padding: 32, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  brand: { fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", margin: 0, textTransform: "uppercase" as const },
  title: { fontSize: 24, fontWeight: 600, color: "#0f172a", marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  label: { display: "block", fontSize: 14, fontWeight: 500, color: "#334155", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", fontSize: 16, border: "1px solid #cbd5e1", borderRadius: 8, boxSizing: "border-box" as const },
  error: { background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 8, fontSize: 14, marginBottom: 16 },
  button: { width: "100%", padding: "10px 16px", fontSize: 16, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", border: "none", borderRadius: 8, cursor: "pointer" },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  link: { marginTop: 24, textAlign: "center" as const, fontSize: 14, color: "#64748b" },
  linkA: { color: "#334155", fontWeight: 500 },
  field: { marginBottom: 16 },
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.brand}>Task Management</p>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>Enter your credentials to continue</p>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder="you" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={styles.link}>
          No account? <Link to="/register" style={styles.linkA}>Register</Link>
        </p>
      </div>
    </div>
  );
}
