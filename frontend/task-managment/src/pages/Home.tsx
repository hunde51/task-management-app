import { useAuth } from "../contexts/AuthContext";

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: 16 },
  card: { maxWidth: 400, width: "100%", background: "white", padding: 32, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" as const },
  brand: { fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", margin: 0, textTransform: "uppercase" as const },
  title: { fontSize: 24, fontWeight: 600, color: "#0f172a", marginTop: 8, marginBottom: 4 },
  text: { color: "#64748b", marginTop: 8, marginBottom: 24 },
  button: { padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", border: "none", borderRadius: 8, cursor: "pointer" },
};

export default function Home() {
  const { logout } = useAuth();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.brand}>Task Management</p>
        <h1 style={styles.title}>You're in</h1>
        <p style={styles.text}>Signed in successfully.</p>
        <button type="button" onClick={logout} style={styles.button}>Sign out</button>
      </div>
    </div>
  );
}
