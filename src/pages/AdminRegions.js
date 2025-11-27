import React, { useState, useEffect } from "react";
import API_BASE from "../utils/apiBase";

function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [editingMapping, setEditingMapping] = useState(null);

  const [regionForm, setRegionForm] = useState({
    name: "",
    description: "",
    enabled: true,
  });

  const [mappingForm, setMappingForm] = useState({
    countryCode: "",
    countryName: "",
    regionId: "",
    enabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [regionsRes, mappingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/regions`, {
          headers: { "x-admin": "true" },
        }),
        fetch(`${API_BASE}/api/admin/country-region-mappings`, {
          headers: { "x-admin": "true" },
        }),
      ]);

      if (regionsRes.ok && mappingsRes.ok) {
        const regionsData = await regionsRes.json();
        const mappingsData = await mappingsRes.json();
        setRegions(regionsData.regions || []);
        setMappings(mappingsData.mappings || []);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRegion
        ? `${API_BASE}/api/admin/regions/${editingRegion.id}`
        : `${API_BASE}/api/admin/regions`;
      const method = editingRegion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin": "true",
        },
        body: JSON.stringify(regionForm),
      });

      if (response.ok) {
        setSuccess(
          editingRegion
            ? "Region updated successfully"
            : "Region created successfully",
        );
        setShowRegionForm(false);
        setEditingRegion(null);
        setRegionForm({ name: "", description: "", enabled: true });
        loadData();
      } else {
        setError("Failed to save region");
      }
    } catch (err) {
      setError("Failed to save region");
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingMapping
        ? `${API_BASE}/api/admin/country-region-mappings/${editingMapping.id}`
        : `${API_BASE}/api/admin/country-region-mappings`;
      const method = editingMapping ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin": "true",
        },
        body: JSON.stringify(mappingForm),
      });

      if (response.ok) {
        setSuccess(
          editingMapping
            ? "Mapping updated successfully"
            : "Mapping created successfully",
        );
        setShowMappingForm(false);
        setEditingMapping(null);
        setMappingForm({
          countryCode: "",
          countryName: "",
          regionId: "",
          enabled: true,
        });
        loadData();
      } else {
        setError("Failed to save mapping");
      }
    } catch (err) {
      setError("Failed to save mapping");
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/${type}s/${id}`, {
        method: "DELETE",
        headers: { "x-admin": "true" },
      });

      if (response.ok) {
        setSuccess(
          `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        );
        loadData();
      } else {
        setError(`Failed to delete ${type}`);
      }
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  const startEditRegion = (region) => {
    setEditingRegion(region);
    setRegionForm({
      name: region.name,
      description: region.description,
      enabled: region.enabled,
    });
    setShowRegionForm(true);
  };

  const startEditMapping = (mapping) => {
    setEditingMapping(mapping);
    setMappingForm({
      countryCode: mapping.countryCode,
      countryName: mapping.countryName,
      regionId: mapping.regionId,
      enabled: mapping.enabled,
    });
    setShowMappingForm(true);
  };

  const resetForms = () => {
    setShowRegionForm(false);
    setShowMappingForm(false);
    setEditingRegion(null);
    setEditingMapping(null);
    setRegionForm({ name: "", description: "", enabled: true });
    setMappingForm({
      countryCode: "",
      countryName: "",
      regionId: "",
      enabled: true,
    });
  };

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: "2rem" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading region data...</p>
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
              <h1 className="h3 mb-0 text-gray-800">Region Management</h1>
              <p className="text-muted">
                Manage regions and country-region mappings for search
                restrictions
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="close"
                onClick={() => setError("")}
              >
                <span>&times;</span>
              </button>
            </div>
          )}
          {success && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              {success}
              <button
                type="button"
                className="close"
                onClick={() => setSuccess("")}
              >
                <span>&times;</span>
              </button>
            </div>
          )}

          {/* Regions Section */}
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Regions</h6>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  resetForms();
                  setShowRegionForm(true);
                }}
              >
                <i className="fa fa-plus mr-1"></i>
                Add Region
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((region) => (
                      <tr key={region.id}>
                        <td>{region.name}</td>
                        <td>{region.description}</td>
                        <td>
                          <span
                            className={`badge ${region.enabled ? "badge-success" : "badge-secondary"}`}
                          >
                            {region.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-info mr-1"
                            onClick={() => startEditRegion(region)}
                          >
                            <i className="fa fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete("region", region.id)}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Country-Region Mappings Section */}
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">
                Country-Region Mappings
              </h6>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  resetForms();
                  setShowMappingForm(true);
                }}
              >
                <i className="fa fa-plus mr-1"></i>
                Add Mapping
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Country Code</th>
                      <th>Region</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td>{mapping.countryName}</td>
                        <td>{mapping.countryCode}</td>
                        <td>{mapping.regionName}</td>
                        <td>
                          <span
                            className={`badge ${mapping.enabled ? "badge-success" : "badge-secondary"}`}
                          >
                            {mapping.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-info mr-1"
                            onClick={() => startEditMapping(mapping)}
                          >
                            <i className="fa fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDelete("country-region-mapping", mapping.id)
                            }
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Region Form Modal */}
          {showRegionForm && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingRegion ? "Edit Region" : "Add New Region"}
                    </h5>
                    <button
                      type="button"
                      className="close"
                      onClick={resetForms}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <form onSubmit={handleRegionSubmit}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={regionForm.name}
                          onChange={(e) =>
                            setRegionForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={regionForm.description}
                          onChange={(e) =>
                            setRegionForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="regionEnabled"
                          checked={regionForm.enabled}
                          onChange={(e) =>
                            setRegionForm((prev) => ({
                              ...prev,
                              enabled: e.target.checked,
                            }))
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="regionEnabled"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForms}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingRegion ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Mapping Form Modal */}
          {showMappingForm && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingMapping
                        ? "Edit Country-Region Mapping"
                        : "Add New Mapping"}
                    </h5>
                    <button
                      type="button"
                      className="close"
                      onClick={resetForms}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <form onSubmit={handleMappingSubmit}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Country Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={mappingForm.countryCode}
                          onChange={(e) =>
                            setMappingForm((prev) => ({
                              ...prev,
                              countryCode: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="e.g., IN, GB, SG"
                          maxLength={3}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Country Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={mappingForm.countryName}
                          onChange={(e) =>
                            setMappingForm((prev) => ({
                              ...prev,
                              countryName: e.target.value,
                            }))
                          }
                          placeholder="e.g., India, United Kingdom"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Region</label>
                        <select
                          className="form-control"
                          value={mappingForm.regionId}
                          onChange={(e) =>
                            setMappingForm((prev) => ({
                              ...prev,
                              regionId: e.target.value,
                            }))
                          }
                          required
                        >
                          <option value="">Select Region</option>
                          {regions
                            .filter((r) => r.enabled)
                            .map((region) => (
                              <option key={region.id} value={region.id}>
                                {region.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="mappingEnabled"
                          checked={mappingForm.enabled}
                          onChange={(e) =>
                            setMappingForm((prev) => ({
                              ...prev,
                              enabled: e.target.checked,
                            }))
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="mappingEnabled"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetForms}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingMapping ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminRegions;
