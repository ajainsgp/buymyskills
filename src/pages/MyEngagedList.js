import React, { useState, useEffect } from "react";
import API_BASE from "../utils/apiBase";

function MyEngagedList() {
  const [engagedList, setEngagedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [ratingSeller, setRatingSeller] = useState(null);
  const [rating, setRating] = useState(0);

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

    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCurrentUser(user);
    loadEngagedList(user);
  }, []);

  const loadEngagedList = async (user) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/buyer-engaged`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEngagedList(data.engagedList || []);
      } else {
        setError("Failed to load engaged list");
      }
    } catch (err) {
      setError("Failed to load engaged list");
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (engagedId) => {
    if (rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/buyer-engaged/${engagedId}/rating`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-current-user": JSON.stringify(currentUser),
          },
          body: JSON.stringify({ rating }),
        },
      );

      if (response.ok) {
        alert("Rating submitted successfully!");
        setRatingSeller(null);
        setRating(0);
        // Reload the list to show updated ratings
        loadEngagedList(currentUser);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Rating error:", error);
      alert("Failed to submit rating");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div
        className="rating-stars"
        style={{ display: "flex", alignItems: "center", gap: "2px" }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fa fa-star ${interactive ? (star <= rating ? "text-warning" : "text-muted") : star <= ratingValue ? "text-warning" : "text-muted"}`}
            style={{
              fontSize: "16px",
              cursor: interactive ? "pointer" : "default",
            }}
            onClick={interactive ? () => setRating(star) : undefined}
          ></i>
        ))}
        {interactive && (
          <span
            style={{ fontSize: "12px", marginLeft: "8px", color: "#6c757d" }}
          >
            Click to rate
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid" style={{ padding: "2rem" }}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading your engaged list...</p>
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
              <h1 className="h3 mb-0 text-gray-800">My Hired List</h1>
              <p className="text-muted">
                Sellers you&apos;ve worked with and their ratings
              </p>
            </div>
            <div>
              <span className="badge badge-info">
                Total Engaged: {engagedList.length}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Rating Modal */}
          {ratingSeller && (
            <div
              className="modal show d-block"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Rate {ratingSeller.sellerName}
                    </h5>
                    <button
                      type="button"
                      className="close"
                      onClick={() => {
                        setRatingSeller(null);
                        setRating(0);
                      }}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>
                      How would you rate your experience with{" "}
                      {ratingSeller.sellerName}?
                    </p>
                    <div className="text-center my-4">
                      {renderStars(rating, true)}
                    </div>
                    <small className="text-muted">
                      1 star = Poor, 5 stars = Excellent
                    </small>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setRatingSeller(null);
                        setRating(0);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRating(ratingSeller.id)}
                      disabled={rating === 0}
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engaged List */}
          <div className="card shadow">
            <div className="card-body">
              {engagedList.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fa fa-handshake-o fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No engagements yet</h5>
                  <p className="text-muted">
                    When you mark sellers as engaged after using their skills,
                    they&apos;ll appear here.
                    <br />
                    <a href="/browse">Browse sellers</a> to get started.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Seller</th>
                        <th>Category</th>
                        <th>Engaged Date</th>
                        <th>Your Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagedList.map((engagement) => (
                        <tr key={engagement.id}>
                          <td>
                            <div>
                              <strong>{engagement.sellerName}</strong>
                              <br />
                              <small className="text-muted">
                                ID: {engagement.sellerId}
                              </small>
                            </div>
                          </td>
                          <td>{engagement.sellerCategory || "N/A"}</td>
                          <td>{formatDate(engagement.dateSkillsUsed)}</td>
                          <td>
                            {engagement.rating ? (
                              <div>
                                {renderStars(engagement.rating)}
                                <br />
                                <small className="text-muted">
                                  Rated on {formatDate(engagement.ratingDate)}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">Not rated yet</span>
                            )}
                          </td>
                          <td>
                            {!engagement.rating && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setRatingSeller(engagement)}
                              >
                                <i className="fa fa-star mr-1"></i>
                                Rate Seller
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyEngagedList;
