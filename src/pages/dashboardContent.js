import React, { useEffect, useState } from "react";
import "./dashboardContent.css";
import API_BASE from "../utils/apiBase";
//import UserProfile from "../components/UserProfileCard";
import UserProfile from "../components/UserProfile";

function DashboardContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                showSensitive={Boolean(localStorage.getItem("currentUser"))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
