import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import API_BASE from "../utils/apiBase";

function Footer() {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [averageRating, setAverageRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <span
          key={i}
          className={`star ${filled ? "filled" : ""}`}
          onClick={interactive ? () => onStarClick(i) : undefined}
          style={{
            cursor: interactive ? "pointer" : "default",
            fontSize: "24px",
            color: filled ? "#ffc107" : "#ddd",
            marginRight: "2px",
          }}
        >
          ★
        </span>,
      );
    }
    return stars;
  };

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        const currentUser =
          sessionStorage.getItem("currentUser") ||
          (localStorage.getItem("rememberMe") === "true"
            ? localStorage.getItem("currentUser")
            : null);
        setIsLoggedIn(!!currentUser && JSON.parse(currentUser));
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => checkAuth();
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "currentUser") handleAuthChange();
    });

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // Fetch average rating
    const fetchAverage = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ratings/average`);
        if (res.ok) {
          const data = await res.json();
          setAverageRating(data.average);
        }
      } catch {
        // ignore
      }
    };
    fetchAverage();
  }, []);

  const handleRateSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const currentUser = JSON.parse(
        sessionStorage.getItem("currentUser") ||
          localStorage.getItem("currentUser"),
      );
      const payload = {
        userId: currentUser.id,
        name: currentUser.firstName + " " + currentUser.lastName,
        rating,
        comment,
      };
      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setRating(5);
        setComment("");
        // Refresh average
        const avgRes = await fetch(`${API_BASE}/api/ratings/average`);
        if (avgRes.ok) {
          const data = await avgRes.json();
          setAverageRating(data.average);
        }
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary text-white py-4">
      <div className="container">
        <hr className="border-white" />
        <div className="row">
          <div className="col-md-6">
            <p>{t("footer.aboutDescription")}</p>
            <h5>{t("brand.title")}</h5>
          </div>
          <div className="col-md-6 text-md-right">
            <p>
              {averageRating !== null && (
                <>
                  {t("footer.appsRating")}{" "}
                  {renderStars(Math.floor(averageRating))} {averageRating}/5
                  {isLoggedIn && " | "}
                </>
              )}
              {isLoggedIn && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModal(true);
                  }}
                  className="text-white"
                >
                  {t("footer.rateThisApp")}
                </a>
              )}
            </p>
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("footer.rateThisApp")}</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleRateSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>{t("footer.ratingLabel")}</label>
                    <div>
                      {renderStars(rating, true, (newRating) =>
                        setRating(newRating),
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t("footer.commentLabel")}</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={600} // approx 100 words
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    {t("footer.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? t("footer.submitting") : t("footer.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop show"></div>}
    </footer>
  );
}

export default Footer;
