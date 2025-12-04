/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from "react";
import API_BASE from "../../utils/apiBase";

function Topbar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

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

    const handleAuth = () => {
      setCurrentUser(getCurrentUser());
    };
    const handleStorage = (e) => {
      if (!e || e.key === "currentUser") {
        setCurrentUser(getCurrentUser());
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth-changed", handleAuth);
      window.addEventListener("storage", handleStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-changed", handleAuth);
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberMe");
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new Event("auth-changed"));
    }
    setCurrentUser(null);
    // Navigate to home page after logout
    if (typeof window !== "undefined" && window.location) {
      window.location.href = "/home";
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = async (user) => {
    if (!user || !user.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/messages/unread-count`, {
        method: 'GET',
        headers: {
          'x-current-user': JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
      setUnreadCount(0);
    }
  };

  // Fetch unread feedback count
  const fetchUnreadFeedbackCount = async (user) => {
    if (!user || !user.id) {
      setUnreadFeedbackCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/feedback/unread-count`, {
        method: 'GET',
        headers: {
          'x-current-user': JSON.stringify(user),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadFeedbackCount(data.unreadCount || 0);
      } else {
        setUnreadFeedbackCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch unread feedback count:', error);
      setUnreadFeedbackCount(0);
    }
  };

  // Update unread count when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount(currentUser);
      fetchUnreadFeedbackCount(currentUser);
      // Set up periodic updates every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount(currentUser);
        fetchUnreadFeedbackCount(currentUser);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setUnreadFeedbackCount(0);
    }
  }, [currentUser]);

  // Listen for message updates
  useEffect(() => {
    const handleMessageUpdate = () => {
      if (currentUser) {
        fetchUnreadCount(currentUser);
      }
    };

    const handleFeedbackUpdate = () => {
      if (currentUser) {
        fetchUnreadFeedbackCount(currentUser);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message-updated", handleMessageUpdate);
      window.addEventListener("feedback-updated", handleFeedbackUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message-updated", handleMessageUpdate);
        window.removeEventListener("feedback-updated", handleFeedbackUpdate);
      }
    };
  }, [currentUser]);

  const isAdmin = currentUser && (String(currentUser.roleType || "").toLowerCase() === "administrative" ||
                  String(currentUser.roleType || "").toLowerCase() === "administrator");

  return (
    <div className="topbar mb-4 sticky-top" style={{ zIndex: 1020 }}>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow position-relative">
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center" href="/">
          <img
            src="/logo96.png"
            alt="Buy My Skills Logo"
            className="mr-2"
            style={{ height: '60px', width: '60px' }}
          />
          <div>
            <div className="font-weight-bold">Buy My Skills</div>
            <small className="text-muted">Connecting people, powering possibilities</small>
          </div>
        </a>

        {/* Navbar Toggler for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links */}
        <div className="collapse navbar-collapse bg-white" id="navbarNav" style={{ zIndex: 1060 }}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link text-dark" href={isAdmin ? "/admin/categories" : "/browse"}>
                {isAdmin ? "Categories" : "Browse Skills"}
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-dark" href="/how-it-works">
                How it Works
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-dark" href="/about-us">
                About
              </a>
            </li>
            {currentUser && (
              <>
                <li className="nav-item">
                  <a className="nav-link text-dark" href="/feedback">
                    Support
                    {unreadFeedbackCount > 0 && (
                      <span className="badge badge-danger ml-1" style={{ fontSize: '10px' }}>
                        {unreadFeedbackCount}
                      </span>
                    )}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link text-dark" href="/my-engaged-list">
                    My Engaged List
                  </a>
                </li>
              </>
            )}
          </ul>

          {/* Search Form */}
          <form className="d-none d-lg-inline-block form-inline mx-auto my-2 my-md-0 mw-100 navbar-search">
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <input
                type="text"
                className="form-control bg-light border-0 small"
                placeholder="Search for any skill..."
                aria-label="Search"
                aria-describedby="basic-addon2"
              />
              <div className="input-group-append">
                <button className="btn btn-primary" type="button">
                  <i className="fas fa-search fa-sm"></i>
                </button>
              </div>
            </div>
          </form>

          {/* Right side buttons */}
          {currentUser ? (
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <a className="nav-link text-dark" href="/messages">
                  Messages
                  {unreadCount > 0 && (
                    <span className="badge badge-danger ml-1" style={{ fontSize: '10px' }}>
                      {unreadCount}
                    </span>
                  )}
                </a>
              </li>
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle text-dark"
                  href="#"
                  role="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  {currentUser.name || currentUser.nickName || "User"}
                </a>
                <div className="dropdown-menu dropdown-menu-right" style={{ display: dropdownOpen ? 'block' : 'none' }}>
                  <a className="dropdown-item" href="/profile" onClick={() => setDropdownOpen(false)}>
                    View Profile
                  </a>
                  <a className="dropdown-item" href="/update-password" onClick={() => setDropdownOpen(false)}>
                    Update Password
                  </a>
                  {isAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <a className="dropdown-item" href="/admin/categories" onClick={() => setDropdownOpen(false)}>
                        Manage Categories
                      </a>
                      <a className="dropdown-item" href="/admin/countries" onClick={() => setDropdownOpen(false)}>
                        Manage Countries
                      </a>
                      <a className="dropdown-item" href="/admin/landing-page-cards" onClick={() => setDropdownOpen(false)}>
                        Manage Landing Page Cards
                      </a>
                      <a className="dropdown-item" href="/admin/feedback" onClick={() => setDropdownOpen(false)}>
                        Manage Feedback
                      </a>
                      <a className="dropdown-item" href="/admin/regions" onClick={() => setDropdownOpen(false)}>
                        Manage Regions
                      </a>
                      <a className="dropdown-item" href="/readme" onClick={() => setDropdownOpen(false)}>
                        Read Me
                      </a>
                    </>
                  )}
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#" onClick={() => { handleLogout(); setDropdownOpen(false); }}>
                    Sign Out
                  </a>
                </div>
              </li>
            </ul>
          ) : (
            <>
              <ul className="navbar-nav ml-auto d-none d-lg-flex">
                <li className="nav-item">
                  <a className="btn btn-outline-primary mr-2 text-nowrap" href="/login">
                    Sign In
                  </a>
                </li>
                <li className="nav-item">
                  <a className="btn btn-primary text-nowrap" href="/register">
                    Become a Seller
                  </a>
                </li>
              </ul>
              <ul className="navbar-nav ml-auto d-lg-none">
                <li className="nav-item">
                  <a className="nav-link text-dark" href="/login">
                    Sign In
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link text-dark" href="/register">
                    Become a Seller
                  </a>
                </li>
              </ul>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Topbar;
