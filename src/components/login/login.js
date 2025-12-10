import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./login.css";
import API_BASE from "../../utils/apiBase";
import { validateEmail } from "../../utils/validation";

function LoginApps() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ emailId: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showReactivation, setShowReactivation] = useState(false);
  const [reactivationReason, setReactivationReason] = useState("");
  const [reactivationSubmitting, setReactivationSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    // Real-time validation
    if (name === "emailId") {
      const validation = validateEmail(value);
      setFieldErrors((prev) => ({
        ...prev,
        emailId: validation.message,
      }));
    }
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
        // Check if account is disabled
        if (data?.accountDisabled) {
          setShowReactivation(true);
          setError("");
          setForm((p) => ({ ...p, password: "" }));
          setSubmitting(false);
          return;
        }
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

  const onReactivationSubmit = async (e) => {
    e.preventDefault();

    try {
      setReactivationSubmitting(true);
      const payload = { emailId: form.emailId, reason: reactivationReason };
      const res = await fetch(`${API_BASE}/api/reactivation-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      // Success - close modal and show success message
      setShowReactivation(false);
      setReactivationReason("");
      setError("");
      // Show success message
      alert(data.message || "Reactivation request submitted successfully!");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setReactivationSubmitting(false);
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
                  <div className="title-row">
                    <img
                      src="/logo96.png"
                      alt="Buy My Skills Icon"
                      className="login-icon"
                    />
                    <h3 className="title">{t("brand.title")}</h3>
                  </div>
                  <h4 className="sub-title">{t("auth.login.title")}</h4>
                </div>
                <div className="right-content col-lg-6">
                  <h3 className="form-title">{t("auth.login.signIn")}</h3>
                  <form className="form-horizontal" onSubmit={onSubmit}>
                    <div className="form-group">
                      <label>{t("auth.login.email")}</label>
                      <input
                        type="email"
                        name="emailId"
                        className="form-control"
                        placeholder="you@example.com"
                        value={form.emailId}
                        onChange={onChange}
                      />
                      {fieldErrors.emailId && (
                        <small className="form-text text-danger">
                          {fieldErrors.emailId}
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>{t("auth.login.password")}</label>
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
                      {submitting
                        ? t("common.loading")
                        : t("auth.login.signIn")}
                    </button>
                    <div className="remember-me">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      <span className="check-label">
                        {t("auth.login.rememberMe")}
                      </span>
                    </div>
                    <a
                      href="#"
                      className="forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/update-password?mode=reset");
                      }}
                    >
                      {t("auth.login.forgotPassword")}
                    </a>
                  </form>
                  {/* <span className="separator">OR</span>
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
                  </ul> */}
                  <span className="signup-link">
                    {t("auth.login.noAccount")}{" "}
                    <a href="/register">{t("auth.login.signUp")}</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reactivation Request Modal */}
      {showReactivation && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Account Reactivation</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowReactivation(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Your account has been deactivated. To reactivate your account,
                  please submit a reactivation request.
                </p>
                <form onSubmit={onReactivationSubmit}>
                  <div className="form-group">
                    <label htmlFor="reactivationReason">
                      Reason for reactivation (optional)
                    </label>
                    <textarea
                      id="reactivationReason"
                      className="form-control"
                      rows="3"
                      value={reactivationReason}
                      onChange={(e) => setReactivationReason(e.target.value)}
                      placeholder="Please explain why you want to reactivate your account..."
                    />
                  </div>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowReactivation(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reactivationSubmitting}
                    >
                      {reactivationSubmitting
                        ? "Submitting..."
                        : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {showReactivation && <div className="modal-backdrop fade show"></div>}
    </>
  );
}

export default LoginApps;
