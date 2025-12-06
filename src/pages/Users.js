import React, { useState, useEffect, useCallback } from "react";
import API_BASE from "../utils/apiBase";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const PAGE_SIZE = 50;

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

  const loadUsers = useCallback(
    async (reset = false) => {
      if (loading || (!hasMore && !reset)) return;

      setLoading(true);
      try {
        const currentPage = reset ? 1 : page;
        const response = await fetch(
          `${API_BASE}/api/admin/users?page=${currentPage}&limit=${PAGE_SIZE}&search=${encodeURIComponent(searchTerm)}`,
          {
            method: "GET",
            headers: {
              "x-current-user": JSON.stringify(currentUser),
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const newUsers = data.users || [];

          if (reset) {
            setUsers(newUsers);
            setPage(2);
          } else {
            setUsers((prev) => [...prev, ...newUsers]);
            setPage((prev) => prev + 1);
          }

          setHasMore(newUsers.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, page, searchTerm, currentUser],
  );

  // Initial load
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadUsers(true);
    }
  }, [currentUser, isAdmin]); // Removed loadUsers from dependencies

  // Search effect
  useEffect(() => {
    if (currentUser && isAdmin) {
      const delayDebounceFn = setTimeout(() => {
        loadUsers(true);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, currentUser, isAdmin]); // Removed loadUsers from dependencies

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || "",
      gender: user.gender || "",
      roleType: user.roleType || "",
      startDate: user.startDate
        ? new Date(user.startDate).toISOString().split("T")[0]
        : "",
      endDate: user.endDate
        ? new Date(user.endDate).toISOString().split("T")[0]
        : "",
      enabled: user.enabled !== undefined ? user.enabled : true,
    });
  };

  const handleSave = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        // Update the user in the local state
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, ...editForm } : user,
          ),
        );
        setEditingUser(null);
        setEditForm({});
      } else {
        console.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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
        <h1 className="h3 mb-0 text-gray-800">User Management</h1>
      </div>

      {/* Search */}
      <div className="card mb-4" style={{ height: "5rem" }}>
        <div className="card-body">
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by email, first name, last name, or nickname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Enabled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="text-muted small">{user.id}</td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editForm.firstName}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        user.firstName || ""
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editForm.lastName}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        user.lastName || ""
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        user.name || ""
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <select
                          className="form-control form-control-sm"
                          value={editForm.gender}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              gender: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select...</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </select>
                      ) : (
                        user.gender || ""
                      )}
                    </td>
                    <td className="text-muted small">{user.emailId}</td>
                    <td>
                      {editingUser === user.id ? (
                        <select
                          className="form-control form-control-sm"
                          value={editForm.roleType}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              roleType: e.target.value,
                            }))
                          }
                        >
                          <option value="user">User</option>
                          <option value="buyer">Buyer</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      ) : (
                        user.roleType || ""
                      )}
                    </td>
                    <td className="small">{formatDate(user.createdAt)}</td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={editForm.startDate || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        formatDate(user.startDate) || ""
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={editForm.endDate || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        formatDate(user.endDate) || ""
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <select
                          className="form-control form-control-sm"
                          value={editForm.enabled ? "true" : "false"}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              enabled: e.target.value === "true",
                            }))
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${!user.enabled ? "badge-success" : "badge-danger"}`}
                        >
                          {!user.enabled ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={() => handleSave(user.id)}
                          >
                            <i className="fas fa-check"></i> Save
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={handleCancel}
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(user)}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                      )}
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
              <span className="ml-2">Loading users...</span>
            </div>
          )}

          {hasMore && !loading && users.length > 0 && (
            <div className="text-center py-3">
              <button className="btn btn-primary" onClick={() => loadUsers()}>
                Load More Users
              </button>
            </div>
          )}

          {!hasMore && users.length > 0 && (
            <div className="text-center py-3 text-muted">
              No more users to load.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
