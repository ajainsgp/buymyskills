import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./UserProfile.css";
import API_BASE from "../utils/apiBase";

function UserProfile({ userProfiles, showSensitive = false }) {
  const { t } = useTranslation();
  const [flips, setFlips] = useState(Array(userProfiles.length).fill(false));
  const [photos, setPhotos] = useState({});
  const [ratings, setRatings] = useState({});
  const [showMobile, setShowMobile] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(null);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
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

    // eslint-disable-next-line no-unused-vars
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
              if (!res.ok) {
                return [p.id, null];
              }
              const data = await res.json().catch(() => ({}));
              return [p.id, data.rating];
            } catch (error) {
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
      } catch (error) {
        console.log("Error in loadRatings:", error);
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
        alert(t("userProfile.engagedSuccess"));
      }
      // If not engaged, we don't do anything - they can always change later
    } catch (error) {
      console.error("Engagement error:", error);
      alert(t("userProfile.engagementFailed"));
    }
  };

  const handleSendMessage = async (receiverId) => {
    if (!currentUser) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(currentUser),
        },
        body: JSON.stringify({
          receiverId,
          subject: messageSubject.trim(),
          content: messageContent.trim(),
        }),
      });

      if (response.ok) {
        alert(t("userProfile.messageSent"));
        setShowMessageForm(null);
        setMessageSubject("");
        setMessageContent("");

        // Notify other components that messages have been updated
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new Event("message-updated"));
        }
      } else {
        alert(t("userProfile.messageFailed"));
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert(t("userProfile.messageFailed"));
    } finally {
      setSendingMessage(false);
    }
  };

  const getGenderPronoun = (gender) => {
    switch (gender) {
      case "M":
        return "him";
      case "F":
        return "her";
      case "O":
      default:
        return "him/her";
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;

    // If user has no ratings yet, show message
    if (rating.averageRating === null || rating.totalRatings === 0) {
      return (
        <div
          className="no-ratings-text"
          style={{
            fontSize: "12px",
            color: "#f5f7f9ff",
            fontStyle: "italic",
            fontWeight: "500",
          }}
        >
          {t("userProfile.noRatingsYet")}
        </div>
      );
    }

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
        <span
          style={{ fontSize: "12px", marginLeft: "4px", color: "#eff2f5ff" }}
        >
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
          showSensitive
            ? t("userProfile.clickToFlip")
            : t("userProfile.loginToViewContact")
        }
        style={{ cursor: showSensitive ? "pointer" : "default" }}
      >
        <div className={`front ${borderColor}`}>
          <div className="card-body header-front">
            <div className="headerContent">
              <div>
                <h5 className="card-title">{profile.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  {profile.nickName || profile.firstName}
                </h6>
                <h6 className="card-subtitle mb-2">{profile.category}</h6>
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
            <div className="user-profile-skills-rating-row">
              <div className="skill-bubble">
                <strong>{t("userProfile.skills")}</strong>
              </div>
              {ratings[profile.id] && (
                <div className="rating-bubble">
                  {renderStars(ratings[profile.id])}
                </div>
              )}
            </div>
            <p className="card-text">{profile.keywordTags}</p>
            <p className="card-text">{profile.summary || "-"}</p>
          </div>
          <div className="card-footer bg-transparent">
            <div className="card-footer-grid">
              <div>
                <strong>{t("userProfile.availability")}</strong>{" "}
                {profile.availability === "0"
                  ? t("userProfile.immediate")
                  : profile.availability === "1"
                    ? t("userProfile.in1Month")
                    : profile.availability === "2"
                      ? t("userProfile.in2Months")
                      : profile.availability === "3"
                        ? t("userProfile.in3Months")
                        : profile.availability}
              </div>
              <div>
                <strong>{t("userProfile.location")}</strong>{" "}
                {profile.address?.city || "N/A"},{" "}
                {profile.address?.country || "N/A"}
              </div>
              <div>
                <strong>{t("userProfile.workPreference")}</strong>{" "}
                {profile.workPreference === "R"
                  ? t("userProfile.remote")
                  : profile.workPreference === "OS"
                    ? t("userProfile.onSite")
                    : profile.workPreference === "H"
                      ? t("userProfile.hybrid")
                      : profile.workPreference}
              </div>
            </div>
            {!showSensitive && (
              <div className="text-muted" style={{ fontSize: "0.9em" }}>
                {t("userProfile.pleaseLoginToConnect")}{" "}
                <a href="/login">{t("userProfile.login")}</a>
              </div>
            )}
          </div>
        </div>

        <div className={`back ${borderColor}`}>
          <div className="card-body header-back">
            <h5 className="card-title">{t("userProfile.contactDetails")}</h5>
          </div>
          <div className="card-body body-back">
            <p style={{ marginBottom: 0 }}>
              {t("userProfile.email")}{" "}
              {showSensitive
                ? profile.allowEmailContact
                  ? profile.emailId
                  : t("userProfile.private")
                : t("userProfile.loginToView")}
            </p>
            <p style={{ marginBottom: 0 }}>
              {t("userProfile.mobile")}{" "}
              {showSensitive ? (
                profile.allowMobileContact ? (
                  showMobile[profile.id] ? (
                    profile.mobile || "N/A"
                  ) : (
                    <button
                      className="btn btn-link p-0"
                      onClick={(e) => handleContactClick(profile.id, e)}
                      style={{ textDecoration: "none", color: "#007bff" }}
                    >
                      {t("userProfile.contact")}{" "}
                      {profile.firstName ||
                        profile.name?.split(" ")[0] ||
                        t("userProfile.himHer")}
                    </button>
                  )
                ) : (
                  t("userProfile.private")
                )
              ) : (
                t("userProfile.loginToView")
              )}
            </p>
            {showSensitive && profile.facebookUrl && (
              <p style={{ marginBottom: 0 }}>
                {t("userProfile.facebook")}{" "}
                <a
                  href={profile.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {profile.facebookUrl}
                </a>
              </p>
            )}
            {showSensitive && profile.linkedinUrl && (
              <p style={{ marginBottom: 0 }}>
                {t("userProfile.linkedin")}{" "}
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {profile.linkedinUrl}
                </a>
              </p>
            )}
            {showSensitive && (profile.startingPrice || profile.negotiable) && (
              <p style={{ marginBottom: 0 }}>
                <strong>{t("userProfile.price")}</strong>{" "}
                {profile.startingPrice && profile.currencyCode
                  ? `${profile.currencyCode} ${parseFloat(profile.startingPrice).toFixed(2)}`
                  : ""}
                {profile.rateType && (
                  <span
                    style={{ marginLeft: profile.startingPrice ? "5px" : "0" }}
                  >
                    (
                    {profile.rateType === "H"
                      ? t("userProfile.hourly")
                      : t("userProfile.daily")}
                    )
                  </span>
                )}
                {profile.negotiable && (
                  <span
                    style={{
                      marginLeft:
                        profile.startingPrice || profile.rateType ? "5px" : "0",
                    }}
                  >
                    ({t("userProfile.negotiable")})
                  </span>
                )}
              </p>
            )}
            {showSensitive && currentUser && currentUser.id !== profile.id && (
              <div className="d-flex align-items-center">
                <strong style={{ fontSize: "14px" }}>
                  {t("userProfile.didYouHire")}{" "}
                  {getGenderPronoun(profile.gender)}?
                </strong>
                <div className="btn-group btn-group-sm ml-2">
                  <button
                    className="btn btn-success btn-sm"
                    style={{ lineHeight: "0.75" }}
                    onClick={(e) => handleEngagement(profile.id, true, e)}
                  >
                    {t("userProfile.yes")}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ lineHeight: "0.75" }}
                    onClick={(e) => handleEngagement(profile.id, false, e)}
                  >
                    {t("userProfile.no")}
                  </button>
                </div>
              </div>
            )}
            {showSensitive && currentUser && currentUser.id !== profile.id && (
              <div>
                <button
                  className="mt-1 btn btn-primary btn-sm mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMessageForm(
                      showMessageForm === profile.id ? null : profile.id,
                    );
                  }}
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  <i className="fa fa-envelope mr-1"></i>
                  {t("userProfile.sendMessage")}
                </button>
              </div>
            )}
            {showMessageForm === profile.id && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <div
                  className="border rounded p-2"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <div className="form-group mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={t("userProfile.subject")}
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder={t("userProfile.yourMessage")}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="text-right">
                    <button
                      className="btn btn-secondary btn-sm mr-1"
                      onClick={() => {
                        setShowMessageForm(null);
                        setMessageSubject("");
                        setMessageContent("");
                      }}
                    >
                      {t("userProfile.cancel")}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendMessage(profile.id)}
                      disabled={
                        !messageSubject.trim() ||
                        !messageContent.trim() ||
                        sendingMessage
                      }
                    >
                      {sendingMessage
                        ? t("userProfile.sending")
                        : t("userProfile.send")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {showMessageForm !== profile.id && (
            <div className="card-footer bg-transparent">
              <div className="card-footer-grid">
                <div>
                  <strong>{t("userProfile.availability")}:</strong>{" "}
                  {profile.availability === "0"
                    ? t("userProfile.immediate")
                    : profile.availability === "1"
                      ? t("userProfile.in1Month")
                      : profile.availability === "2"
                        ? t("userProfile.in2Months")
                        : profile.availability === "3"
                          ? t("userProfile.in3Months")
                          : profile.availability}
                </div>
                <div>
                  <strong>{t("userProfile.location")}:</strong>{" "}
                  {profile.address?.city || "N/A"},{" "}
                  {profile.address?.country || "N/A"}
                </div>
                <div>
                  <strong>{t("userProfile.workPreference")}:</strong>{" "}
                  {profile.workPreference === "R"
                    ? t("userProfile.remote")
                    : profile.workPreference === "OS"
                      ? t("userProfile.onSite")
                      : profile.workPreference === "H"
                        ? t("userProfile.hybrid")
                        : profile.workPreference}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });
}

export default UserProfile;
