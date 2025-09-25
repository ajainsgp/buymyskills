import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import API_BASE from "../../utils/apiBase";

function LoginApps() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailId: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.emailId || !form.password) {
      setError("Email and Password are required.");
      return;
    }

    try {
      setSubmitting(true);
      // Send plaintext password to API; server hashes/verifies with bcrypt
      const payload = { emailId: form.emailId, password: form.password };
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }
      try {
        if (remember) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          localStorage.setItem("rememberMe", "true");
          sessionStorage.removeItem("currentUser");
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(data.user));
          localStorage.removeItem("currentUser");
          localStorage.removeItem("rememberMe");
        }
      } catch {
        // ignore
      }
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("auth-changed"));
      }
      const isAdmin =
        String(data.user.roleType || "").toLowerCase() === "administrative" ||
        String(data.user.roleType || "").toLowerCase() === "administrator";
      navigate(isAdmin ? "/browse" : "/home");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setForm((p) => ({ ...p, password: "" }));
    }
  };

  return (
    <>
      <div className="form-bg">
        <div className="container">
          <div className="row">
            <div className="col-md-offset-4 col-md-12 col-sm-offset-3 col-sm-12">
              <div className="form-container row">
                <div className="left-content col-lg-6">
                  <h3 className="title">Buy My Skills</h3>
                  <h4 className="sub-title">
                    Welcome to the world of opportunities
                  </h4>
                </div>
                <div className="right-content col-lg-6">
                  <h3 className="form-title">Login</h3>
                  <form className="form-horizontal" onSubmit={onSubmit}>
                    <div className="form-group">
                      <label>Username / Email</label>
                      <input
                        type="email"
                        name="emailId"
                        className="form-control"
                        placeholder="you@example.com"
                        value={form.emailId}
                        onChange={onChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={onChange}
                      />
                    </div>
                    {error ? (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    ) : null}
                    <button
                      className="btn signin"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? "Logging in..." : "Login"}
                    </button>
                    <div className="remember-me">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="check-label">Remember Me</span>
                    </div>
                    <a
                      href="#"
                      className="forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/update-password?mode=reset");
                      }}
                    >
                      Update password if forgot
                    </a>
                  </form>
                  <span className="separator">OR</span>
                  <ul className="social-links">
                    <li>
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <i className="fab fa-google"></i> Login with Google
                      </a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <i className="fab fa-facebook-f"></i> Login with
                        Facebook
                      </a>
                    </li>
                  </ul>
                  <span className="signup-link">
                    Don&#39;t have an account? Sign up{" "}
                    <a href="/register">here</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white py-4">
        <div className="container">
          <hr className="border-white" />
          <div className="row">
            <div className="col-md-6">
              <p>Connecting talent with opportunity.</p>
              <h5>BuyMySkills</h5>
            </div>
            <div className="col-md-6 text-md-right">
              <p>&copy; 2024 BuyMySkills. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default LoginApps;
