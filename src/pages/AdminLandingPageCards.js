import React, { useEffect, useMemo, useState } from "react";
import API_BASE from "../utils/apiBase";
import "./AdminCategories.css";

function AdminLandingPageCards() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cards, setCards] = useState([]);
  const [adding, setAdding] = useState(false);
  const [checkedRole, setCheckedRole] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSection, setSelectedSection] = useState("categories");
  const [newCard, setNewCard] = useState({
    sectionName: "categories",
    icon: "",
    icon_color: "#042C76",
    cardTitle: "",
    cardText: "",
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
      const res = await fetch(
        `${API_BASE}/api/admin/landing-page-cards?section=${selectedSection}`,
        {
          headers,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      setCards(Array.isArray(data.cards) ? data.cards : []);
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
  }, [isAdmin, selectedSection]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr("");
    if (!newCard.cardTitle.trim() || !newCard.icon.trim()) {
      setErr("Title and icon are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/landing-page-cards`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sectionName: newCard.sectionName.trim(),
          icon: newCard.icon.trim(),
          icon_color: newCard.icon_color.trim(),
          cardTitle: newCard.cardTitle.trim(),
          cardText: newCard.cardText.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Create failed (${res.status})`);
      }
      setNewCard({
        icon: "",
        icon_color: "#042C76",
        cardTitle: "",
        cardText: "",
      });
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
      const res = await fetch(
        `${API_BASE}/api/admin/landing-page-cards/${id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(patch),
        },
      );
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
    if (!window.confirm("Delete this landing page card?")) return;
    setErr("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/landing-page-cards/${id}`,
        {
          method: "DELETE",
          headers,
        },
      );
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
            <h1 className="h3 mb-0 text-gray-800">Admin: Landing Page Cards</h1>
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
          <h1 className="h3 mb-0 text-gray-800">Admin: Landing Page Cards</h1>
          <div className="d-flex align-items-center">
            <label className="mb-0 mr-2">Section:</label>
            <select
              className="form-control form-control-sm"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="categories">Categories</option>
              <option value="skills">Skills</option>
              <option value="features">Features</option>
            </select>
          </div>
        </div>

        {err ? (
          <div className="alert alert-danger" role="alert">
            {err}
          </div>
        ) : null}

        <div className="card mb-4 admin-category-card">
          <div className="card-header category-card-header">
            Add Landing Page Card
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="form-group col-md-2">
                  <label>Section</label>
                  <select
                    className="form-control"
                    value={newCard.sectionName}
                    onChange={(e) =>
                      setNewCard((p) => ({ ...p, sectionName: e.target.value }))
                    }
                    disabled={disabled || adding}
                  >
                    <option value="categories">Categories</option>
                    <option value="skills">Skills</option>
                    <option value="features">Features</option>
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Icon</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="fas fa-code fa-lg"
                    value={newCard.icon}
                    onChange={(e) =>
                      setNewCard((p) => ({ ...p, icon: e.target.value }))
                    }
                    disabled={disabled || adding}
                  />
                </div>
                <div className="form-group col-md-1">
                  <label>Icon Color</label>
                  <input
                    type="color"
                    className="form-control"
                    value={newCard.icon_color}
                    onChange={(e) =>
                      setNewCard((p) => ({ ...p, icon_color: e.target.value }))
                    }
                    disabled={disabled || adding}
                  />
                </div>
                <div className="form-group col-md-3">
                  <label>Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Development"
                    value={newCard.cardTitle}
                    onChange={(e) =>
                      setNewCard((p) => ({ ...p, cardTitle: e.target.value }))
                    }
                    disabled={disabled || adding}
                  />
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

        <div className="card manage-category-card">
          <div className="card-header category-card-header">
            Manage Landing Page Cards
          </div>
          <div className="card-body">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>Icon</th>
                      <th style={{ width: 50 }}>Icon Color</th>
                      <th style={{ width: 150 }}>Title</th>
                      <th style={{ width: 100 }}>Text</th>
                      <th style={{ width: 120 }}>Created</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">
                          No landing page cards
                        </td>
                      </tr>
                    ) : (
                      cards
                        .sort((a, b) => a.cardTitle.localeCompare(b.cardTitle))
                        .map((card) => (
                          <tr key={card.id}>
                            <td className="text-center">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={card.icon}
                                onChange={(e) => {
                                  const icon = e.target.value;
                                  setCards((prev) =>
                                    prev.map((row) => {
                                      if (row.id === card.id) {
                                        return { ...row, icon };
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
                                type="color"
                                className="form-control form-control-sm"
                                value={card.icon_color || "#042C76"}
                                onChange={(e) => {
                                  const icon_color = e.target.value;
                                  setCards((prev) =>
                                    prev.map((row) => {
                                      if (row.id === card.id) {
                                        return { ...row, icon_color };
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
                                type="text"
                                className="form-control form-control-sm"
                                value={card.cardTitle}
                                onChange={(e) => {
                                  const cardTitle = e.target.value;
                                  setCards((prev) =>
                                    prev.map((row) => {
                                      if (row.id === card.id) {
                                        return { ...row, cardTitle };
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
                                type="text"
                                className="form-control form-control-sm"
                                value={card.cardText}
                                onChange={(e) => {
                                  const cardText = e.target.value;
                                  setCards((prev) =>
                                    prev.map((row) => {
                                      if (row.id === card.id) {
                                        return { ...row, cardText };
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
                                {card.createdAt}
                              </span>
                            </td>
                            <td>
                              <div
                                className="btn-group btn-group-sm"
                                style={{ gap: ".2rem" }}
                              >
                                <button
                                  className="btn btn-primary"
                                  disabled={disabled}
                                  onClick={() =>
                                    handleUpdate(card.id, {
                                      icon: card.icon,
                                      icon_color: card.icon_color,
                                      cardTitle: card.cardTitle,
                                      cardText: card.cardText,
                                    })
                                  }
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-danger"
                                  disabled={disabled}
                                  onClick={() => handleDelete(card.id)}
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
              Note: Changes to landing page cards will be reflected on the
              homepage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLandingPageCards;
