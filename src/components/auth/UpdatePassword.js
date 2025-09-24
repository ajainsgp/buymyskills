import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_BASE from "../../utils/apiBase";

function UpdatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Session info (if logged in)
  const [currentUser, setCurrentUser] = useState(null);

  // Form fields
  const [emailId, setEmailId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Determine mode:
  // - "change": user is logged in and changing with current password
  // - "reset": user forgot password (email + new password)
  const explicitMode = searchParams.get("mode");
  const mode = useMemo(() => {
    if (explicitMode === "reset") return "reset";
    return currentUser ? "change" : "reset";
  }, [explicitMode, currentUser]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const cu = JSON.parse(raw);
        setCurrentUser(cu);
        if (cu?.emailId) {
          setEmailId(cu.emailId);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const validate = () => {
    if (mode === "change") {
      if (!currentUser?.id) return "Not logged in.";
      if (!currentPassword) return "Current password is required.";
      if (!newPassword) return "New password is required.";
      if (newPassword.length < 6)
        return "New password must be at least 6 characters.";
      if (newPassword !== confirmNewPassword)
        return "New password and confirm do not match.";
      return "";
    }
    // reset mode
    if (!emailId) return "Email is required.";
    if (!newPassword) return "New password is required.";
    if (newPassword.length < 6)
      return "New password must be at least 6 characters.";
    if (newPassword !== confirmNewPassword)
      return "New password and confirm do not match.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "change") {
        const res = await fetch(`${API_BASE}/api/password/change`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentUser.id,
            currentPassword,
            newPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Failed (${res.status})`);
        }
        setNotice("Password updated successfully.");
        // Keep user logged in; no need to change localStorage user object
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccess(true);
      } else {
        const res = await fetch(`${API_BASE}/api/password/reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailId,
            newPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Failed (${res.status})`);
        }
        setNotice(
          "Password reset successfully. You can now login with your new password.",
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            {mode === "change" ? "Update Password" : "Reset Password"}
          </h1>
        </div>

        <div className="row">
          <div className="col-lg-6 col-md-8">
            <div className="panel panel-body">
              <form onSubmit={onSubmit}>
                {error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : null}
                {notice ? (
                  <div className="alert alert-success" role="alert">
                    {notice}
                  </div>
                ) : null}

                {mode === "reset" ? (
                  <div className="form-group">
                    <div className="panel panel-info">
                      <div className="panel-heading">Your email Id</div>
                      <input
                        type="email"
                        className="form-control input-lg"
                        placeholder="you@example.com"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                      />
                      <small className="form-text text-muted">
                        Enter the email you used to register your account.
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <div className="panel panel-info">
                      <div className="panel-heading">Your email Id</div>
                      <input
                        type="email"
                        className="form-control input-lg"
                        value={emailId}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                  </div>
                )}

                {mode === "change" ? (
                  <div className="form-group">
                    <div className="panel panel-info">
                      <div className="panel-heading">Current password</div>
                      <input
                        type="password"
                        className="form-control input-lg"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="form-group">
                  <div className="panel panel-info">
                    <div className="panel-heading">New password</div>
                    <input
                      type="password"
                      className="form-control input-lg"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="panel panel-info">
                    <div className="panel-heading">Confirm new password</div>
                    <input
                      type="password"
                      className="form-control input-lg"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  {success ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate("/home")}
                    >
                      Close
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting
                          ? mode === "change"
                            ? "Updating..."
                            : "Resetting..."
                          : mode === "change"
                            ? "Update Password"
                            : "Reset Password"}
                      </button>
                      {mode === "reset" ? (
                        <button
                          type="button"
                          className="btn btn-default"
                          disabled={submitting}
                          style={{ marginLeft: 8 }}
                          onClick={() => navigate("/login")}
                        >
                          Back to Login
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-default"
                          disabled={submitting}
                          style={{ marginLeft: 8 }}
                          onClick={() => navigate(-1)}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-6 col-md-4">
            {/* optional right column for help/instructions */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdatePassword;
