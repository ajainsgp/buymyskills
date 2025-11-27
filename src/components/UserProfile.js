import React, { useEffect, useState } from "react";
import "./UserProfile.css";
import API_BASE from "../utils/apiBase";

function UserProfile({ userProfiles, showSensitive = false }) {
  const [flips, setFlips] = useState(Array(userProfiles.length).fill(false));
  const [photos, setPhotos] = useState({});
  const [ratings, setRatings] = useState({});
  const [showMobile, setShowMobile] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  // Load current user
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

  // Load photos and ratings
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

    async function loadRatings() {
      try {
        const ratingEntries = await Promise.all(
          (userProfiles || []).map(async (p) => {
            if (!p || !p.id) return [null, null];
            try {
              const res = await fetch(`${API_BASE}/api/users/${p.id}/rating`);
              if (!res.ok) return [p.id, null];
              const data = await res.json().catch(() => ({}));
              return [p.id, data.rating];
            } catch {
              return [p.id, null];
            }
          }),
        );
        if (!cancelled) {
          const ratingMap = {};
          for (const [id, rating] of ratingEntries) {
            if (id) ratingMap[id] = rating;
          }
          setRatings(ratingMap);
        }
      } catch {
        // ignore
      }
    }

    loadPhotos();
    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [userProfiles]);

  const flipCard = (index) => {
    const newFlips = [...flips];
    newFlips[index] = !newFlips[index];
    setFlips(newFlips);
  };

  const handleContactClick = (profileId, event) => {
    event.stopPropagation(); // Prevent card flip
    setShowMobile((prev) => ({
      ...prev,
      [profileId]: !prev[profileId],
    }));
  };

  const handleEngagement = async (sellerId, engaged, event) => {
    event.stopPropagation(); // Prevent card flip

    if (!currentUser) return;

    try {
      if (engaged) {
        // Mark as engaged
        await fetch(`${API_BASE}/api/buyer-engaged`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-current-user": JSON.stringify(currentUser),
          },
          body: JSON.stringify({ sellerUserId: sellerId }),
        });
        alert("Successfully marked as engaged with this seller!");
      }
      // If not engaged, we don't do anything - they can always change later
    } catch (error) {
      console.error("Engagement error:", error);
      alert("Failed to update engagement status");
    }
  };

  const renderStars = (rating) => {
    if (!rating || !rating.averageRating) return null;

    return (
      <div
        className="rating-stars"
        style={{ display: "flex", alignItems: "center", gap: "2px" }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fa fa-star ${star <= rating.averageRating ? "text-warning" : "text-muted"}`}
            style={{ fontSize: "14px" }}
          ></i>
        ))}
        <span style={{ fontSize: "12px", marginLeft: "4px", color: "#6c757d" }}>
          ({rating.totalRatings})
        </span>
      </div>
    );
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
            <div className="user-profile-skills">
              <strong>Skills</strong>
              {ratings[profile.id] && renderStars(ratings[profile.id])}
            </div>
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
                Please login to view contact details. <a href="/login">Login</a>
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
            <p>
              Mobile:{" "}
              {showSensitive ? (
                showMobile[profile.id] ? (
                  profile.mobile || "N/A"
                ) : (
                  <button
                    className="btn btn-link p-0"
                    onClick={(e) => handleContactClick(profile.id, e)}
                    style={{ textDecoration: "none", color: "#007bff" }}
                  >
                    Contact{" "}
                    {profile.firstName ||
                      profile.name?.split(" ")[0] ||
                      "him/her"}
                  </button>
                )
              ) : (
                "Login to view"
              )}
            </p>
            {showSensitive && currentUser && currentUser.id !== profile.id && (
              <div className="mt-3 d-flex align-items-center">
                <strong style={{ fontSize: "14px" }}>
                  Did you used the skills?
                </strong>
                <div className="btn-group btn-group-sm ml-2">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => handleEngagement(profile.id, true, e)}
                  >
                    Yes
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => handleEngagement(profile.id, false, e)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
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
