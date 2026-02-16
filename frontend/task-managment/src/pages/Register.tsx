import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: 24 },
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
  row: { display: "flex", gap: 12 },
  half: { flex: 1 },
};

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ username, email, first_name: firstName, last_name: lastName, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.brand}>Task Management</p>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Get started with your account</p>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.row}>
            <div style={{ ...styles.field, ...styles.half }}>
              <label htmlFor="firstName" style={styles.label}>First name</label>
              <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" placeholder="Jane" style={styles.input} />
            </div>
            <div style={{ ...styles.field, ...styles.half }}>
              <label htmlFor="lastName" style={styles.label}>Last name</label>
              <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" placeholder="Doe" style={styles.input} />
            </div>
          </div>
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder="you" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" style={styles.input} />
          </div>
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="••••••••" style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}>
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login" style={styles.linkA}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
