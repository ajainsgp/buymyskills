import React, { useState, useEffect, useCallback } from "react";
import API_BASE from "../utils/apiBase";

function AdminFeedbackSupport() {
  const [feedback, setFeedback] = useState([]);
  const [support, setSupport] = useState([]);
  const [reactivationRequests, setReactivationRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("support");
  const [currentUser, setCurrentUser] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

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

  const loadSupport = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/support`, {
        method: "GET",
        headers: {
          "x-current-user": JSON.stringify(currentUser),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupport(data.support || []);
      }
    } catch (error) {
      console.error("Failed to load support:", error);
    } finally {
      setLoading(false);
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

  const loadReactivationRequests = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/reactivation-requests`,
        {
          method: "GET",
          headers: {
            "x-current-user": JSON.stringify(currentUser),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setReactivationRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load reactivation requests:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin]);

  const handleReactivationAction = async (requestId, action) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/reactivation-requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-current-user": JSON.stringify(currentUser),
          },
          body: JSON.stringify({ action }),
        },
      );

      if (response.ok) {
        // Reload the reactivation requests
        loadReactivationRequests();
        alert(`Reactivation request ${action}d successfully.`);
      } else {
        alert("Failed to process reactivation request.");
      }
    } catch (error) {
      console.error("Failed to process reactivation request:", error);
      alert("Error processing reactivation request.");
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadSupport();
      loadFeedback();
      loadReactivationRequests();
    }
  }, [
    currentUser,
    isAdmin,
    loadSupport,
    loadFeedback,
    loadReactivationRequests,
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleString();
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

  // Filter support based on search term
  const filteredSupport = support.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.sender.name || "").toLowerCase().includes(searchLower) ||
      (item.sender.email || "").toLowerCase().includes(searchLower) ||
      (item.content || "").toLowerCase().includes(searchLower)
    );
  });

  // Filter reactivation requests based on search term
  const filteredReactivationRequests = reactivationRequests.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(searchLower) ||
      (item.emailId || "").toLowerCase().includes(searchLower) ||
      (item.reason || "").toLowerCase().includes(searchLower)
    );
  });

  // Handle sort toggle
  const handleSortToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  // Sort data by created date
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  const currentData =
    activeTab === "support"
      ? support
      : activeTab === "activate"
        ? reactivationRequests
        : feedback;
  const filteredData =
    activeTab === "support"
      ? sortData(filteredSupport)
      : activeTab === "activate"
        ? sortData(filteredReactivationRequests)
        : sortData(filteredFeedback);

  return (
    <div className="container-fluid">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Feedback Support Management</h1>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === "support" ? "active" : ""}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("support");
            }}
          >
            Support ({support.length})
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === "feedback" ? "active" : ""}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("feedback");
            }}
          >
            Feedback ({feedback.length})
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === "activate" ? "active" : ""}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("activate");
            }}
          >
            Activate ({reactivationRequests.length})
          </a>
        </li>
      </ul>

      {/* Search */}
      <div className="card mb-4" style={{ height: "5rem" }}>
        <div className="card-body">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder={
                activeTab === "activate"
                  ? "Search by name, email, or reason..."
                  : "Search by sender name, email, or content..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            {activeTab === "activate" ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Reason</th>
                    <th
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={handleSortToggle}
                    >
                      Requested At {sortOrder === "desc" ? "↓" : "↑"}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted small">{item.id}</td>
                      <td>{item.name}</td>
                      <td className="text-muted small">{item.emailId}</td>
                      <td style={{ maxWidth: "300px" }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.reason || "No reason provided"}
                        </div>
                      </td>
                      <td className="small">{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              handleReactivationAction(item.id, "approve")
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleReactivationAction(item.id, "reject")
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sender</th>
                    <th>To</th>
                    <th>Content</th>
                    <th
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={handleSortToggle}
                    >
                      Created At {sortOrder === "desc" ? "↓" : "↑"}
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td className="text-muted small">{item.id}</td>
                      <td>
                        <div>{item.sender.name}</div>
                        <div className="text-muted small">
                          {item.sender.email}
                        </div>
                      </td>
                      <td>
                        <div>{item.receiver.name}</div>
                        <div className="text-muted small">
                          {item.receiver.email}
                        </div>
                      </td>
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
            )}
          </div>

          {loading && (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <span className="ml-2">Loading {activeTab}...</span>
            </div>
          )}

          {!loading &&
            filteredData.length === 0 &&
            currentData.length === 0 && (
              <div className="text-center py-3 text-muted">
                No {activeTab}{" "}
                {activeTab === "activate" ? "requests" : "messages"}.
              </div>
            )}

          {!loading && filteredData.length === 0 && currentData.length > 0 && (
            <div className="text-center py-3 text-muted">
              No {activeTab}{" "}
              {activeTab === "activate" ? "requests" : "messages"} match your
              search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminFeedbackSupport;
