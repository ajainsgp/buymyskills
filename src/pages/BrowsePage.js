/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/apiBase";
import UserProfile from "../components/UserProfile";
import { useLocation } from "react-router-dom";

function BrowsePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const reqSeqRef = useRef(0);

  const [currentUser, setCurrentUser] = useState(null);

  // Simple filters for now
  const [kw, setKw] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchKw, setSearchKw] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

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

  useEffect(() => {
    // Fetch categories
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCategoryFilter(value === "all" ? "" : value);
  };

  const handleSearch = () => {
    setKw(searchKw);
  };

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

  // Filtered data

  const filtered = users.filter((u) => {
    const sHay = [u.name, u.nickName, u.summary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const kwOk = !kw || sHay.includes(kw.toLowerCase());
    const categoryOk =
      !categoryFilter ||
      (u.category || "").toLowerCase() === categoryFilter.toLowerCase();
    return kwOk && categoryOk;
  });

  const displayUsers = filtered;

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <div className="container-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              Find the Perfect Skill for Your Project
            </h1>
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search for skills..."
                    aria-label="Search for skills"
                    value={searchKw}
                    onChange={(e) => setSearchKw(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button className="btn btn-primary btn-lg" type="button" onClick={handleSearch}>
                      <i className="fas fa-search"></i> Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button className="btn btn-light btn-lg mr-3">
                <i className="fas fa-star"></i> Popular Skills
              </button>
              <select
                className="form-control form-control-lg d-inline-block w-auto"
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ maxWidth: '200px' }}
              >
                <option value="all">All Categories</option>
                {categories.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section className="py-5">
        <div className="container">
          {loading && <div className="text-center">Loading users...</div>}
          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="row">
              {displayUsers.length > 0 ? (
                displayUsers.map((user) => (
                  <div key={user.id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                    <UserProfile userProfiles={[user]} showSensitive={!!currentUser} />
                  </div>
                ))
              ) : (
                <div className="col-12 text-center">
                  <p>No users found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-4">
        <div className="container-fluid">
          <hr className="border-white" />
          <div className="row">
            <div className="col-md-6">
              <p>Connecting talent with opportunity.</p>
              <h5>BuyMySkills</h5>
            </div>
            <div className="col-md-6 text-md-right">
              <p>&copy; 2024 BuyMySkills. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default BrowsePage;
