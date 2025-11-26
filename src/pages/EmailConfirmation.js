import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_BASE from "../utils/apiBase";

function EmailConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    try {
      const pendingUser = localStorage.getItem("pendingUser");
      if (pendingUser) {
        setUser(JSON.parse(pendingUser));
      }
    } catch {
      // ignore storage errors
    }

    // Check if there's a token in the URL
    const token = searchParams.get("token");
    if (token) {
      handleConfirmation(token);
    }
  }, [searchParams]);

  const handleConfirmation = async (token) => {
    try {
      setConfirming(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Confirmation failed");
      }

      setSuccess(true);

      // Clear pending user data
      try {
        localStorage.removeItem("pendingUser");
      } catch {
        // ignore storage errors
      }

      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setConfirming(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.emailId) return;

    try {
      setConfirming(true);
      setError("");

      // Here you could implement resend logic if needed
      // For now, just show a message
      alert(
        "Please check your email. If you haven't received the confirmation email, please contact support.",
      );
    } catch (err) {
      setError("Failed to resend email");
    } finally {
      setConfirming(false);
    }
  };

  if (success) {
    return (
      <div className="container-fluid">
        <div style={{ padding: "2rem" }}>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="text-center">
                <div className="alert alert-success">
                  <h4>
                    <i className="fa fa-check-circle"></i> Email Confirmed!
                  </h4>
                  <p>
                    Your email has been successfully confirmed. Your account is
                    now active.
                  </p>
                  <p>
                    You will be redirected to the login page in a few seconds...
                  </p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div style={{ padding: "2rem" }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="text-center">
              <h2>
                <i className="fa fa-envelope"></i> Check Your Email
              </h2>
              <div className="alert alert-info">
                <p>
                  We&apos;ve sent a confirmation email to{" "}
                  <strong>{user?.emailId}</strong>
                </p>
                <p>
                  Please click the confirmation link in the email to activate
                  your account.
                </p>
                <p>The link will expire in 24 hours.</p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mt-4">
                <p>Didn&apos;t receive the email?</p>
                <button
                  className="btn btn-secondary"
                  onClick={handleResendEmail}
                  disabled={confirming}
                >
                  {confirming ? "Sending..." : "Resend Email"}
                </button>
                <br />
                <button
                  className="btn btn-link mt-2"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmation;
