import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_BASE from "../../utils/apiBase";
import { validatePassword } from "../../utils/validation";
import { useTranslation } from "react-i18next";

function UpdatePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

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
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(null); // null = not checked, true = exists, false = doesn't exist

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);

    // Real-time validation
    const validation = validatePassword(value);
    setFieldErrors((prev) => ({
      ...prev,
      newPassword: validation.message,
    }));
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmNewPassword(value);

    // Check if passwords match
    if (newPassword && value && newPassword !== value) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
    }
  };

  const handleEmailChange = async (e) => {
    const value = e.target.value;
    setEmailId(value);

    // Reset email existence check when email changes
    if (emailExists !== null) {
      setEmailExists(null);
    }

    // Check if email exists (debounced)
    if (value.trim() && mode === "reset") {
      setCheckingEmail(true);
      try {
        // Debounce the check
        setTimeout(async () => {
          if (value === emailId) {
            // Make sure the email hasn't changed
            const res = await fetch(`${API_BASE}/api/check-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emailId: value.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            setEmailExists(res.ok && data.exists === true);
          }
        }, 500); // 500ms debounce
      } catch (e) {
        setEmailExists(false);
      } finally {
        setTimeout(() => setCheckingEmail(false), 500);
      }
    }
  };

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Determine mode:
  // - "change": user is logged in and changing with current password
  // - "reset": user forgot password (email + new password)
  const explicitMode = searchParams.get("mode");
  const mode = useMemo(() => {
    // Always check for explicit mode first
    if (explicitMode === "reset") return "reset";
    // Then check if user is logged in
    if (currentUser && currentUser.id) return "change";
    // Default to reset mode
    return "reset";
  }, [explicitMode, currentUser]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check both localStorage and sessionStorage for currentUser
        let raw = localStorage.getItem("currentUser");
        let storageType = "localStorage";

        if (!raw) {
          raw = sessionStorage.getItem("currentUser");
          storageType = "sessionStorage";
        }

        console.log(`Raw ${storageType} currentUser:`, raw);
        if (raw) {
          const cu = JSON.parse(raw);
          console.log("Parsed currentUser:", cu);
          setCurrentUser(cu);

          // Check if we have email in localStorage - try multiple field names
          let email =
            cu?.emailId ||
            cu?.email ||
            cu?.emailId ||
            cu?.secondaryEmail ||
            cu?.userEmail;
          console.log("Found email in localStorage:", email);

          // If no email in localStorage, try to fetch user profile
          if (!email && cu?.id) {
            console.log("No email in localStorage, fetching from API...");
            try {
              const res = await fetch(`${API_BASE}/api/users/${cu.id}`);
              console.log("API response status:", res.status);
              const data = await res.json().catch(() => ({}));
              console.log("API response data:", data);
              if (res.ok && data.user) {
                email =
                  data.user.emailId || data.user.email || data.user.emailId;
                console.log("Found email from API:", email);
                if (email) {
                  // Update localStorage with complete user data
                  localStorage.setItem(
                    "currentUser",
                    JSON.stringify(data.user),
                  );
                  setCurrentUser(data.user);
                }
              }
            } catch (e) {
              console.error("API fetch error:", e);
            }
          }

          console.log("Final email to set:", email);
          if (email && !emailId) {
            console.log("Setting emailId to:", email);
            setEmailId(email);
          }
        } else {
          console.log("No currentUser in localStorage");
        }
      } catch (e) {
        console.error("Error in loadUserData:", e);
      }
    };

    loadUserData();
  }, []);

  // Also update emailId when currentUser changes (for when user logs in during session)
  useEffect(() => {
    if (currentUser && !emailId) {
      const email = currentUser?.emailId || currentUser?.secondaryEmail;
      if (email) {
        setEmailId(email);
      }
    }
  }, [currentUser, emailId]);

  const validate = () => {
    if (mode === "change") {
      if (!currentUser?.id) return t("updatePassword.notLoggedIn");
      if (!currentPassword) return t("updatePassword.currentPasswordRequired");
      if (!newPassword) return t("updatePassword.newPasswordRequired");
      // Validate strong password requirements
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) return passwordValidation.message;
      if (newPassword !== confirmNewPassword)
        return t("updatePassword.passwordMismatch");
      return "";
    }
    // reset mode
    if (!emailId.trim()) return t("updatePassword.emailRequired");
    if (emailExists === false) return t("updatePassword.emailNotRegistered");
    if (!newPassword) return t("updatePassword.newPasswordRequired");
    // Validate strong password requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) return passwordValidation.message;
    if (newPassword !== confirmNewPassword)
      return t("updatePassword.passwordMismatch");
    return "";
  };

  // Check if form can be submitted
  const canSubmit = () => {
    if (mode === "change") {
      return !!(
        currentUser?.id &&
        currentPassword &&
        newPassword &&
        confirmNewPassword &&
        newPassword === confirmNewPassword
      );
    }
    // reset mode - require emailId to be filled, valid format, and passwords to match
    // Email existence check is done via API but doesn't block submission
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!(
      emailId.trim() &&
      emailRegex.test(emailId.trim()) &&
      newPassword &&
      confirmNewPassword &&
      newPassword === confirmNewPassword
    );
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
        setNotice(t("updatePassword.passwordUpdated"));
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
        setNotice(t("updatePassword.passwordReset"));
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
            {mode === "change"
              ? t("updatePassword.title")
              : t("updatePassword.resetTitle")}
          </h1>
        </div>

        <div className="row">
          <div className="col-lg-6 col-md-8">
            <div className="panel panel-body" style={{ padding: ".3 rem" }}>
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
                      <div className="panel-heading">
                        {t("updatePassword.yourEmail")}
                      </div>
                      <input
                        type="email"
                        className="form-control input-lg"
                        value={emailId}
                        onChange={handleEmailChange}
                      />
                      {checkingEmail && (
                        <small className="form-text text-info">
                          {t("updatePassword.checkingEmail")}
                        </small>
                      )}
                      {emailExists === false && emailId.trim() && (
                        <small className="form-text text-danger">
                          {t("updatePassword.emailNotRegistered")}
                        </small>
                      )}
                      {emailExists === true && (
                        <small className="form-text text-success">
                          {t("updatePassword.emailFound")}
                        </small>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <div className="panel panel-info">
                      <div className="panel-heading">
                        {t("updatePassword.yourEmail")}
                      </div>
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
                      <div className="panel-heading">
                        {t("updatePassword.currentPassword")}
                      </div>
                      <input
                        type="password"
                        className="form-control input-lg"
                        placeholder={t(
                          "updatePassword.currentPasswordPlaceholder",
                        )}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="form-group">
                  <div className="panel panel-info">
                    <div className="panel-heading">
                      {t("updatePassword.newPassword")}
                    </div>
                    <input
                      type="password"
                      className="form-control input-lg"
                      placeholder={t("updatePassword.newPasswordPlaceholder")}
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                    />
                    <small className="form-text text-muted">
                      {t("updatePassword.passwordHelp")}
                    </small>
                    {fieldErrors.newPassword && (
                      <small className="form-text text-danger">
                        {fieldErrors.newPassword}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="panel panel-info">
                    <div className="panel-heading">
                      {t("updatePassword.confirmNewPassword")}
                    </div>
                    <input
                      type="password"
                      className="form-control input-lg"
                      placeholder={t(
                        "updatePassword.confirmNewPasswordPlaceholder",
                      )}
                      value={confirmNewPassword}
                      onChange={handleConfirmPasswordChange}
                    />
                    {fieldErrors.confirmPassword && (
                      <small className="form-text text-danger">
                        {t("updatePassword.passwordMismatch")}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  {success ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        // Log out the user by clearing stored user data
                        localStorage.removeItem("currentUser");
                        sessionStorage.removeItem("currentUser");
                        localStorage.removeItem("rememberMe");

                        // Notify other components about logout
                        if (
                          typeof window !== "undefined" &&
                          window.dispatchEvent
                        ) {
                          window.dispatchEvent(new Event("auth-changed"));
                        }

                        // Navigate to login page
                        navigate("/login");
                      }}
                    >
                      {t("updatePassword.logOut")}
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={submitting || !canSubmit()}
                      >
                        {submitting
                          ? mode === "change"
                            ? t("updatePassword.updating")
                            : t("updatePassword.resetting")
                          : mode === "change"
                            ? t("updatePassword.updatePassword")
                            : t("updatePassword.resetPassword")}
                      </button>
                      {mode === "reset" ? (
                        <button
                          type="button"
                          className="btn btn-default"
                          disabled={submitting}
                          style={{ marginLeft: 8 }}
                          onClick={() => navigate("/login")}
                        >
                          {t("updatePassword.backToLogin")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-default"
                          disabled={submitting}
                          style={{ marginLeft: 8 }}
                          onClick={() => navigate(-1)}
                        >
                          {t("updatePassword.cancel")}
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
