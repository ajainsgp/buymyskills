import React, { useEffect, useMemo, useState } from "react";
import API_BASE from "../utils/apiBase";

function AdminCategories() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(false);
  const [checkedRole, setCheckedRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCat, setNewCat] = useState({
    name: "",
    enabled: true,
    sortOrder: 0,
  });

  // JSON headers only (no Admin Key anymore)
  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  // Determine role from currentUser in localStorage
  useEffect(() => {
    function getCurrentUser() {
      const s = sessionStorage.getItem("currentUser");
      if (s) {
        try {
          return JSON.parse(s);
        } catch (_e) {
          /* ignore */
        }
      }
      if (localStorage.getItem("rememberMe") === "true") {
        const l = localStorage.getItem("currentUser");
        if (l) {
          try {
            return JSON.parse(l);
          } catch (_e) {
            /* ignore */
          }
        }
      }
      return null;
    }
    function sync() {
      try {
        const cu = getCurrentUser();
        let admin = false;
        if (cu) {
          const role = String(cu.roleType || "").toLowerCase();
          const emailLower = String(cu.emailId || "").toLowerCase();
          admin =
            role === "administrator" ||
            role === "administrative" ||
            emailLower === "admin@buymyskills.local";
        }
        setIsAdmin(admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckedRole(true);
      }
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      load();
    }
    // load only when admin state flips true
  }, [isAdmin]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr("");
    if (!newCat.name.trim()) {
      setErr("Name is required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newCat.name.trim(),
          enabled: !!newCat.enabled,
          sortOrder: Number(newCat.sortOrder) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Create failed (${res.status})`);
      }
      setNewCat({ name: "", enabled: true, sortOrder: 0 });
      await load();
    } catch (e) {
      setErr(e.message || "Create failed");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id, patch) => {
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Update failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  };

  if (!checkedRole) {
    // Wait until we know the role to avoid flicker
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="container-fluid">
        <div style={{ paddingBottom: "1.5rem" }}>
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Admin: Categories</h1>
          </div>
          <div className="alert alert-warning" role="alert">
            You are not authorized to view this page.
          </div>
        </div>
      </div>
    );
  }

  const disabled = !isAdmin;

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Admin: Categories</h1>
        </div>

        {err ? (
          <div className="alert alert-danger" role="alert">
            {err}
          </div>
        ) : null}

        <div className="card mb-4">
          <div className="card-header">Add Category</div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="form-group col-md-5">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCat.name}
                    onChange={(e) =>
                      setNewCat((p) => ({ ...p, name: e.target.value }))
                    }
                    disabled={disabled || adding}
                  />
                </div>
                <div className="form-group col-md-3">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newCat.sortOrder}
                    onChange={(e) =>
                      setNewCat((p) => ({
                        ...p,
                        sortOrder: e.target.value,
                      }))
                    }
                    disabled={disabled || adding}
                  />
                </div>
                <div className="form-group col-md-2">
                  <label style={{ display: "block" }}>Enabled</label>
                  <div className="form-check">
                    <input
                      id="new-enabled"
                      className="form-check-input"
                      type="checkbox"
                      checked={!!newCat.enabled}
                      onChange={(e) =>
                        setNewCat((p) => ({
                          ...p,
                          enabled: e.target.checked,
                        }))
                      }
                      disabled={disabled || adding}
                    />
                    <label className="form-check-label" htmlFor="new-enabled">
                      Yes
                    </label>
                  </div>
                </div>
                <div className="form-group col-md-2 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={disabled || adding}
                  >
                    {adding ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Manage Categories</div>
          <div className="card-body">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: 280 }}>Name</th>
                      <th style={{ width: 120 }}>Enabled</th>
                      <th style={{ width: 140 }}>Sort Order</th>
                      <th style={{ width: 220 }}>Created</th>
                      <th style={{ width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center">
                          No categories
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={c.name}
                              onChange={(e) => {
                                const name = e.target.value;
                                setCategories((prev) =>
                                  prev.map((row) => {
                                    if (row.id === c.id) {
                                      return { ...row, name };
                                    }
                                    return row;
                                  }),
                                );
                              }}
                              disabled={disabled}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={!!c.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                setCategories((prev) =>
                                  prev.map((row) => {
                                    if (row.id === c.id) {
                                      return { ...row, enabled };
                                    }
                                    return row;
                                  }),
                                );
                              }}
                              disabled={disabled}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={c.sortOrder ?? 0}
                              onChange={(e) => {
                                const sortOrder = Number(e.target.value) || 0;
                                setCategories((prev) =>
                                  prev.map((row) => {
                                    if (row.id === c.id) {
                                      return { ...row, sortOrder };
                                    }
                                    return row;
                                  }),
                                );
                              }}
                              disabled={disabled}
                            />
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: "#666" }}>
                              {c.createdAt}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-primary"
                                disabled={disabled}
                                onClick={() =>
                                  handleUpdate(c.id, {
                                    name: c.name,
                                    enabled: !!c.enabled,
                                    sortOrder: Number(c.sortOrder) || 0,
                                  })
                                }
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-danger"
                                disabled={disabled}
                                onClick={() => handleDelete(c.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
              Note: Only Enabled categories are returned by GET /api/categories
              and shown in dropdowns.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;
