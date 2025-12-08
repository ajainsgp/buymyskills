import React, { useState, useEffect, useCallback } from "react";
import API_BASE from "../utils/apiBase";

function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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
    setCurrentUser(getCurrentUser());
  }, []);

  const isAdmin =
    currentUser &&
    (String(currentUser.roleType || "").toLowerCase() === "administrative" ||
      String(currentUser.roleType || "").toLowerCase() === "administrator");

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isAdmin) {
      window.location.href = "/home";
    }
  }, [currentUser, isAdmin]);

  const loadFeedback = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/feedback`, {
        method: "GET",
        headers: {
          "x-current-user": JSON.stringify(currentUser),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error("Failed to load feedback:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin]);

  // Initial load
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadFeedback();
    }
  }, [currentUser, isAdmin, loadFeedback]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Filter feedback based on search term
  const filteredFeedback = feedback.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.sender.name || "").toLowerCase().includes(searchLower) ||
      (item.sender.email || "").toLowerCase().includes(searchLower) ||
      (item.content || "").toLowerCase().includes(searchLower)
    );
  });

  if (!isAdmin) {
    return (
      <div className="container mt-4">
        Access denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Feedback Management</h1>
      </div>

      {/* Search */}
      <div className="card mb-4" style={{ height: "5rem" }}>
        <div className="card-body">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by sender name, email, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sender</th>
                  <th>Email</th>
                  <th>Content</th>
                  <th>Created At</th>
                  <th>Read</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((item) => (
                  <tr key={item.id}>
                    <td className="text-muted small">{item.id}</td>
                    <td>{item.sender.name}</td>
                    <td className="text-muted small">{item.sender.email}</td>
                    <td style={{ maxWidth: "300px" }}>
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.content}
                      </div>
                    </td>
                    <td className="small">{formatDate(item.createdAt)}</td>
                    <td>
                      <span
                        className={`badge ${item.isRead ? "badge-success" : "badge-warning"}`}
                      >
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <span className="ml-2">Loading feedback...</span>
            </div>
          )}

          {!loading &&
            filteredFeedback.length === 0 &&
            feedback.length === 0 && (
              <div className="text-center py-3 text-muted">
                No feedback messages.
              </div>
            )}

          {!loading && filteredFeedback.length === 0 && feedback.length > 0 && (
            <div className="text-center py-3 text-muted">
              No feedback messages match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminFeedback;
