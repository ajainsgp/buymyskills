import React, { useEffect, useState } from "react";
import "./dashboardContent.css";
import API_BASE from "../utils/apiBase";
//import UserProfile from "../components/UserProfileCard";
import UserProfile from "../components/UserProfile";
import { useLocation } from "react-router-dom";

function DashboardContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        // Determine roleType to request from API (default "user")
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
  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        {/* <!-- Page Heading --> */}
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
                userProfiles={users}
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

export default DashboardContent;
