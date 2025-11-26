import React, { useState, useEffect } from "react";
import API_BASE from "../utils/apiBase";
import "./Feedback.css";

function Feedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user and feedback on component mount
  useEffect(() => {
    const getCurrentUser = () => {
      try {
        const s = sessionStorage.getItem("currentUser");
        if (s) {
          return JSON.parse(s);
        }
        if (localStorage.getItem("rememberMe") === "true") {
          const l = localStorage.getItem("currentUser");
          if (l) {
            return JSON.parse(l);
          }
        }
      } catch {
        // ignore
      }
      return null;
    };

    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCurrentUser(user);
    loadFeedback(user);
  }, []);

  const loadFeedback = async (user) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      } else {
        setError("Failed to load feedback");
      }
    } catch (err) {
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!newQuery.trim()) {
      setError("Please enter your query");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
        body: JSON.stringify({ query: newQuery }),
      });

      if (response.ok) {
        setSuccess(
          "Feedback submitted successfully! We'll respond to your query soon.",
        );
        setNewQuery("");
        // Reload feedback to show the new entry
        loadFeedback(currentUser);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container-fluid feedback-spinner">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Same as About page */}
      <section
        className="hero-section bg-gradient-primary text-white py-5"
        style={{ paddingLeft: "0px", paddingRight: "0px" }}
      >
        <div className="about-us-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              Support & Feedback
            </h1>
            <p className="lead mb-4">
              Have a question or need help? We&apos;re here to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-fluid feedback-container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            {/* Success/Error Messages */}
            {error && (
              <div className="alert alert-danger feedback-alert" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success feedback-alert" role="alert">
                {success}
              </div>
            )}

            {/* Submit New Feedback */}
            <div className="card shadow feedback-form-card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <i className="fa fa-question-circle mr-2"></i>
                  Ask a Question
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={submitFeedback}>
                  <div className="form-group">
                    <label htmlFor="query">Your Question or Feedback</label>
                    <textarea
                      className="form-control"
                      id="query"
                      rows="4"
                      placeholder="Please describe your question or feedback in detail..."
                      value={newQuery}
                      onChange={(e) => setNewQuery(e.target.value)}
                      required
                    ></textarea>
                    <small className="form-text text-muted">
                      We&apos;ll respond to your query as soon as possible.
                    </small>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm mr-2"
                          role="status"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-paper-plane mr-2"></i>
                        Submit Question
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Previous Feedback */}
            <div className="card shadow feedback-history-card">
              <div className="card-header bg-info text-white">
                <h4 className="mb-0">
                  <i className="fa fa-history mr-2"></i>
                  Your Previous Questions
                </h4>
              </div>
              <div className="card-body">
                {feedback.length === 0 ? (
                  <div className="feedback-empty-state">
                    <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No questions yet</h5>
                    <p className="text-muted">
                      Your submitted questions and our responses will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="feedback-timeline">
                    {feedback.map((item) => (
                      <div key={item.id} className="feedback-timeline-item">
                        <div className="feedback-timeline-marker bg-primary"></div>
                        <div className="feedback-timeline-content">
                          {/* Question */}
                          <div className="card border-primary feedback-card">
                            <div className="card-header bg-light">
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>Your Question</strong>
                                <small className="text-muted">
                                  <i className="fa fa-calendar mr-1"></i>
                                  Asked on {formatDate(item.createdAt)}
                                </small>
                              </div>
                            </div>
                            <div className="card-body">
                              <p className="mb-0">{item.query}</p>
                            </div>
                          </div>

                          {/* Response */}
                          {item.status === "responded" && item.response ? (
                            <div className="card border-success feedback-card feedback-response-card">
                              <div className="card-header bg-success text-white">
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>
                                    <i className="fa fa-reply mr-2"></i>
                                    Our Response
                                  </strong>
                                  <small>
                                    <i className="fa fa-calendar-check-o mr-1"></i>
                                    Responded on {formatDate(item.respondedAt)}
                                  </small>
                                </div>
                              </div>
                              <div className="card-body">
                                <p className="mb-0">{item.response}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="card feedback-pending-card">
                              <div className="card-body text-center">
                                <i className="fa fa-clock-o fa-2x text-warning mb-2"></i>
                                <p className="mb-0 text-muted">
                                  We&apos;re working on your question. Please
                                  check check back soon!
                                </p>
                                <small className="text-muted">
                                  <i className="fa fa-calendar mr-1"></i>
                                  Submitted on {formatDate(item.createdAt)}
                                </small>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
