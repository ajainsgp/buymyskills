import React, { useEffect, useState, useContext } from "react";
import "./dashboardContent2.css";
import API_BASE from "../utils/apiBase";
import UserProfile from "../components/UserProfile";
import { FilterContext } from "../components/sidebar/FilterContext";

function DashboardContent2() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters from sidebar
  const {
    kw,
    availabilityFilter,
    preferenceFilter,
    cityFilter,
    countryFilter,
  } = useContext(FilterContext);

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/users`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg =
            (data && data.error) || `Failed to load users (${res.status})`;
          throw new Error(errMsg);
        }
        if (!aborted) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      } catch (err) {
        if (!aborted) setError(err.message || "Failed to load users");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, []);

  // Build filter options and filtered data
  const normalizePref = (v) => {
    switch (v) {
      case "R":
        return "Remote";
      case "OS":
        return "On Site";
      case "H":
        return "Hybrid";
      default:
        return v || "";
    }
  };
  const normalizeAvail = (v) => {
    switch (v) {
      case "0":
        return "Immediate";
      case "1":
        return "In 1 month";
      case "2":
        return "In 2 months";
      case "3":
        return "In 3 months";
      default:
        return v || "";
    }
  };

  const filtered = users.filter((u) => {
    const sHay = [u.name, u.nickName, u.summary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const kwOk = !kw || sHay.includes(kw.toLowerCase());
    const availOk =
      !availabilityFilter ||
      normalizeAvail(u.availability) === availabilityFilter;
    const prefOk =
      !preferenceFilter || normalizePref(u.workPreference) === preferenceFilter;
    const cityOk =
      !cityFilter ||
      (u.address?.city || "").toLowerCase().includes(cityFilter.toLowerCase());
    const countryOk =
      !countryFilter ||
      (u.address?.country || "")
        .toLowerCase()
        .includes(countryFilter.toLowerCase());
    return kwOk && availOk && prefOk && cityOk && countryOk;
  });

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
        </div>

        <div className="row">
          <div className="cards" style={{ width: "100%" }}>
            {error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : loading ? (
              <div>Loading users...</div>
            ) : (
              <UserProfile
                userProfiles={filtered}
                showSensitive={Boolean(localStorage.getItem("currentUser"))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent2;
