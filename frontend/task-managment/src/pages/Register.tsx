import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import { FormInput } from "../components/ui/FormInput";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">TM</div>
          <h1>Start managing smarter today</h1>
          <p>
            Join thousands of teams using TaskFlow to streamline their workflow, 
            boost productivity, and deliver exceptional results.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Free to start, no credit card required</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Unlimited projects & tasks</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✓</div>
              <span>Invite your team instantly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p className="auth-card-subtitle">Get started with your free workspace</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-row">
              <FormInput id="register-first" label="First name" value={firstName} onChange={setFirstName} required />
              <FormInput id="register-last" label="Last name" value={lastName} onChange={setLastName} required />
            </div>

            <FormInput id="register-user" label="Username" value={username} onChange={setUsername} required />
            <FormInput id="register-email" label="Email" value={email} onChange={setEmail} type="email" required />
            <FormInput
              id="register-pass"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              helperText="At least 8 characters"
              required
            />

            {error && <p className="ui-inline-error">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
