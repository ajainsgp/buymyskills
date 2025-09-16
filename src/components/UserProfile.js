import React, { useEffect, useState } from "react";
import "./UserProfile.css";
import API_BASE from "../utils/apiBase";

function UserProfile({ userProfiles, showSensitive = false }) {
  const [flips, setFlips] = useState(Array(userProfiles.length).fill(false));
  const [photos, setPhotos] = useState({});
  useEffect(() => {
    let cancelled = false;
    async function loadPhotos() {
      try {
        const entries = await Promise.all(
          (userProfiles || []).map(async (p) => {
            if (!p || !p.id) return [null, null];
            try {
              const res = await fetch(`${API_BASE}/api/users/${p.id}/photo`);
              if (!res.ok) return [p.id, null];
              const data = await res.json().catch(() => ({}));
              if (data && data.contentType && data.base64) {
                return [p.id, `data:${data.contentType};base64,${data.base64}`];
              }
              return [p.id, null];
            } catch {
              return [p.id, null];
            }
          }),
        );
        if (!cancelled) {
          const map = {};
          for (const [id, url] of entries) {
            if (id) map[id] = url;
          }
          setPhotos(map);
        }
      } catch {
        // ignore
      }
    }
    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [userProfiles]);

  const flipCard = (index) => {
    const newFlips = [...flips];
    newFlips[index] = !newFlips[index];
    setFlips(newFlips);
  };

  return userProfiles.map((profile, index) => {
    const borderColor =
      profile.availability === "Immediate"
        ? "border-success"
        : "border-warning";

    return (
      <div
        key={index}
        className={`card ${flips[index] ? "flip" : ""}`}
        onClick={() => {
          if (showSensitive) {
            flipCard(index);
          }
        }}
        title={
          showSensitive ? "Click to flip" : "Login to view contact details"
        }
        style={{ cursor: showSensitive ? "pointer" : "default" }}
      >
        <div className={`front ${borderColor}`}>
          <div className="card-body header-front">
            <div className="headerContent">
              <div>
                <h5 className="card-title">{profile.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  {profile.nickName}
                </h6>
              </div>
              <div>
                <img
                  src={
                    photos[profile.id] ||
                    "http://ssl.gstatic.com/accounts/ui/avatar_2x.png"
                  }
                  className="avatar img-circle img-thumbnail"
                  alt="avatar"
                  style={{ borderRadius: "60%" }}
                />
              </div>
            </div>
          </div>
          <div className="card-body body-front">
            <strong>Skills:</strong>
            <p className="card-text">{profile.summary}</p>
          </div>
          <div className="card-footer bg-transparent">
            <div className="card-footer-grid">
              <div>
                <strong>Availability:</strong>{" "}
                {profile.availability === "0"
                  ? "Immediate"
                  : profile.availability === "1"
                    ? "In 1 month"
                    : profile.availability === "2"
                      ? "In 2 months"
                      : profile.availability === "3"
                        ? "In 3 months"
                        : profile.availability}
              </div>
              <div>
                <strong>Location:</strong> {profile.address?.city || "N/A"},{" "}
                {profile.address?.country || "N/A"}
              </div>
              <div>
                <strong>Work Preference:</strong>{" "}
                {profile.workPreference === "R"
                  ? "Remote"
                  : profile.workPreference === "OS"
                    ? "On Site"
                    : profile.workPreference === "H"
                      ? "Hybrid"
                      : profile.workPreference}
              </div>
            </div>
            {!showSensitive && (
              <div className="text-muted" style={{ fontSize: "0.9em" }}>
                Please login or register to view contact details.{" "}
                <a href="/login">Login</a> or <a href="/register">Register</a>.
              </div>
            )}
          </div>
        </div>

        <div className={`back ${borderColor}`}>
          <div className="card-body header-back">
            <h5 className="card-title">Contact Details</h5>
          </div>
          <div className="card-body body-back">
            <p>Email: {showSensitive ? profile.emailId : "Login to view"}</p>
            <p>Mobile: {showSensitive ? profile.mobile : "Login to view"}</p>
          </div>
          <div className="card-footer bg-transparent">
            <div className="card-footer-grid">
              <div>
                <strong>Availability:</strong>{" "}
                {profile.availability === "0"
                  ? "Immediate"
                  : profile.availability === "1"
                    ? "In 1 month"
                    : profile.availability === "2"
                      ? "In 2 months"
                      : profile.availability === "3"
                        ? "In 3 months"
                        : profile.availability}
              </div>
              <div>
                <strong>Location:</strong> {profile.address?.city || "N/A"},{" "}
                {profile.address?.country || "N/A"}
              </div>
            </div>
            <p>
              Preference:{" "}
              {profile.workPreference === "R"
                ? "Remote"
                : profile.workPreference === "OS"
                  ? "On Site"
                  : profile.workPreference === "H"
                    ? "Hybrid"
                    : profile.workPreference}
            </p>
          </div>
        </div>
      </div>
    );
  });
}

export default UserProfile;
