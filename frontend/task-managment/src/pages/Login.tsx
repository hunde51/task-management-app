import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import { FormInput } from "../components/ui/FormInput";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">TM</div>
          <h1>Welcome back to TaskFlow</h1>
          <p>
            Streamline your team's workflow with powerful project management tools. 
            Track tasks, collaborate seamlessly, and deliver projects on time.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Real-time collaboration</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Kanban boards & task tracking</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Team analytics & insights</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in</h2>
            <p className="auth-card-subtitle">Enter your credentials to access your workspace</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <FormInput
              id="login-username"
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
              required
            />
            <FormInput
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />

            {error && <p className="ui-inline-error">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
