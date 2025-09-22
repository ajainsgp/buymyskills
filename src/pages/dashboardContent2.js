import React, { useEffect, useState, useContext, useRef } from "react";
import "./dashboardContent2.css";
import API_BASE from "../utils/apiBase";
import UserProfile from "../components/UserProfile";
import { FilterContext } from "../components/sidebar/FilterContext";
import { useLocation } from "react-router-dom";

function DashboardContent2() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const reqSeqRef = useRef(0);

  // Filters from sidebar
  const {
    kw,
    availabilityFilter,
    preferenceFilter,
    cityFilter,
    countryFilter,
    categoryFilter,
  } = useContext(FilterContext);

  useEffect(() => {
    let aborted = false;

    async function load() {
      const mySeq = (reqSeqRef.current += 1);
      try {
        let rt = "user";
        try {
          const getCurrentUser = () => {
            const s = sessionStorage.getItem("currentUser");
            if (s) {
              try {
                return JSON.parse(s);
              } catch (_e) {
                /* ignore parse error */
              }
            }
            if (localStorage.getItem("rememberMe") === "true") {
              const l = localStorage.getItem("currentUser");
              if (l) {
                try {
                  return JSON.parse(l);
                } catch (_e) {
                  /* ignore parse error */
                }
              }
            }
            return null;
          };
          const cu = getCurrentUser();
          if (cu) {
            const r = String(cu.roleType || "user").toLowerCase();
            rt = r === "administrative" ? "administrator" : r;
          }
        } catch (e) {
          /* ignore */
        }
        const res = await fetch(
          `${API_BASE}/api/users?roleType=${encodeURIComponent(rt)}`,
          { cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg =
            (data && data.error) || `Failed to load users (${res.status})`;
          throw new Error(errMsg);
        }
        if (!aborted && mySeq === reqSeqRef.current) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      } catch (err) {
        if (!aborted && mySeq === reqSeqRef.current) {
          setError(err.message || "Failed to load users");
        }
      } finally {
        if (!aborted && mySeq === reqSeqRef.current) {
          setLoading(false);
        }
      }
    }

    load();

    function handleAuth() {
      load();
    }
    function handleStorage(e) {
      if (!e || e.key === "currentUser") {
        load();
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("auth-changed", handleAuth);
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      aborted = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-changed", handleAuth);
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  // Reload when route changes (e.g., after login redirects)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
  }, [location.pathname]);

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
    const categoryOk =
      !categoryFilter ||
      (u.category || "").toLowerCase() === categoryFilter.toLowerCase();
    return kwOk && availOk && prefOk && cityOk && countryOk && categoryOk;
  });

  const displayUsers = filtered;

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
                userProfiles={displayUsers}
                showSensitive={Boolean(
                  sessionStorage.getItem("currentUser") ||
                    (localStorage.getItem("rememberMe") === "true" &&
                      localStorage.getItem("currentUser")),
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent2;
