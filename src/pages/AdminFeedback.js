import React, { useState, useEffect } from "react";
import API_BASE from "../utils/apiBase";

function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load all feedback on component mount
  useEffect(() => {
    loadAllFeedback();
  }, []);

  const loadAllFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/admin/feedback`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-admin": "true",
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

  const handleRespond = async (feedbackId) => {
    if (!response.trim()) {
      setError("Please enter a response");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const apiResponse = await fetch(
        `${API_BASE}/api/admin/feedback/${feedbackId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin": "true",
          },
          body: JSON.stringify({ response: response.trim() }),
        },
      );

      if (apiResponse.ok) {
        setSuccess("Response sent successfully!");
        setSelectedFeedback(null);
        setResponse("");
        // Reload feedback to show updated status
        loadAllFeedback();
      } else {
        const data = await apiResponse.json();
        setError(data.error || "Failed to send response");
      }
    } catch (err) {
      setError("Failed to send response");
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning">Pending</span>;
      case "responded":
        return <span className="badge badge-success">Responded</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: "2rem" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: "2rem" }}>
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">Feedback Management</h1>
              <p className="text-muted">Manage and respond to user queries</p>
            </div>
            <div>
              <span className="badge badge-info mr-2">
                Total: {feedback.length}
              </span>
              <span className="badge badge-warning">
                Pending: {feedback.filter((f) => f.status === "pending").length}
              </span>
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {/* Response Modal */}
          {selectedFeedback && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Respond to Query</h5>
                    <button
                      type="button"
                      className="close"
                      onClick={() => {
                        setSelectedFeedback(null);
                        setResponse("");
                      }}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* User's Query */}
                    <div className="card mb-3">
                      <div className="card-header">
                        <strong>From: {selectedFeedback.userName}</strong>
                        <small className="text-muted ml-2">
                          {formatDate(selectedFeedback.createdAt)}
                        </small>
                      </div>
                      <div className="card-body">
                        <p className="mb-0">{selectedFeedback.query}</p>
                      </div>
                    </div>

                    {/* Response Form */}
                    <div className="form-group">
                      <label htmlFor="response">Your Response</label>
                      <textarea
                        className="form-control"
                        id="response"
                        rows="6"
                        placeholder="Enter your response to this query..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedFeedback(null);
                        setResponse("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRespond(selectedFeedback.id)}
                      disabled={submitting || !response.trim()}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm mr-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-paper-plane mr-2"></i>
                          Send Response
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Table */}
          <div className="card shadow">
            <div className="card-body">
              {feedback.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No feedback yet</h5>
                  <p className="text-muted">
                    User queries and feedback will appear here.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>User</th>
                        <th>Query</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedback.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div>
                              <strong>{item.userName}</strong>
                              <br />
                              <small className="text-muted">
                                {item.userEmail}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                maxWidth: "300px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.query}
                            </div>
                          </td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>{formatDate(item.createdAt)}</td>
                          <td>
                            {item.status === "pending" ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setSelectedFeedback(item)}
                              >
                                <i className="fa fa-reply mr-1"></i>
                                Respond
                              </button>
                            ) : (
                              <div>
                                <span className="text-success">
                                  <i className="fa fa-check-circle mr-1"></i>
                                  Responded
                                </span>
                                <br />
                                <small className="text-muted">
                                  {formatDate(item.respondedAt)}
                                </small>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminFeedback;
