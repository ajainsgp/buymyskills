import React, { useContext, useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FilterContext } from "./FilterContext";
import countries from "../../data/countries.json";
import API_BASE from "../../utils/apiBase";

export default function SidebarFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    kw,
    setKw,
    availabilityFilter,
    setAvailabilityFilter,
    preferenceFilter,
    setPreferenceFilter,
    cityFilter,
    setCityFilter,
    countryFilter,
    setCountryFilter,
    categoryFilter,
    setCategoryFilter,
    resetFilters,
  } = useContext(FilterContext);

  // Only show filters on dashboard2 (still usable globally if needed)
  const show =
    location.pathname === "/dashboard2" || location.pathname === "/home";

  const availabilityOptions = useMemo(
    () => ["Immediate", "In 1 month", "In 2 months", "In 3 months"],
    [],
  );
  const preferenceOptions = useMemo(() => ["Remote", "On Site", "Hybrid"], []);

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let ignore = false;
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json().catch(() => ({}));
        if (!ignore && res.ok && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        // ignore
      }
    }
    loadCategories();
    return () => {
      ignore = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="sidebar-filter">
      <div className="section-title d-flex justify-content-between align-items-center">
        <span>Filters</span>
      </div>

      <div className="mb-2">
        <label className="form-label">Category</label>
        <select
          className="form-select form-select-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label">Skills</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="e.g. React, Node"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="form-label">Availability</label>
        <select
          className="form-select form-select-sm"
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
        >
          <option value="">All</option>
          {availabilityOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label">Preference</label>
        <select
          className="form-select form-select-sm"
          value={preferenceFilter}
          onChange={(e) => setPreferenceFilter(e.target.value)}
        >
          <option value="">All</option>
          {preferenceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label">City</label>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="City"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="form-label">Country</label>
        <select
          className="form-select form-select-sm"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">All</option>
          {countries
            .filter((c) => c.enabled === "Y")
            .map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-sm w-100 mb-2"
        onClick={() => {
          // ensure results are visible on dashboard2
          if (location.pathname !== "/dashboard2") {
            navigate("/dashboard2");
          }
        }}
      >
        Apply
      </button>
      <button
        type="button"
        className="btn btn-sm btn-light w-100"
        onClick={() => {
          resetFilters();
          // ensure we are on dashboard2 to see results filtered
          if (location.pathname !== "/dashboard2") {
            navigate("/dashboard2");
          }
        }}
        title="Clear all filters"
      >
        Clear
      </button>
    </div>
  );
}
