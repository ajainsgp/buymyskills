/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/apiBase";
import UserProfile from "../components/UserProfile";
import { useLocation, useSearchParams } from "react-router-dom";
import countriesData from "../data/countries.json";

function BrowsePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const reqSeqRef = useRef(0);
  const countrySetRef = useRef(false);



  const [currentUser, setCurrentUser] = useState(null);

  // Simple filters for now
  const [kw, setKw] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchKw, setSearchKw] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [locationDetected, setLocationDetected] = useState(false);

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
      .then(data => {
        const categoryList = (data.categories || []).sort((a, b) => a.localeCompare(b));
        setCategories(categoryList);

        // Check for category query parameter after categories are loaded
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
          setSelectedCategory(categoryParam);
          setCategoryFilter(categoryParam);
        }
      })
      .catch(err => console.error("Error fetching categories:", err));

    // Load countries from imported data
    setCountries(countriesData.filter(c => c.enabled === "Y").map(c => c.name).sort());
  }, [searchParams]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCategoryFilter(value === "all" ? "" : value);
  };

  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountry(value);
    setCountryFilter(value === "all" ? "" : value);
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

  // Set default country based on user profile or IP geolocation
  useEffect(() => {
    if (currentUser && !locationDetected && !countrySetRef.current) {
      // Logged-in user: fetch their profile to get country
      fetch(`${API_BASE}/api/users/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user && data.user.address?.country && selectedCountry === "all") {
            setSelectedCountry(data.user.address.country);
            setCountryFilter(data.user.address.country);
            countrySetRef.current = true;
          }
          setLocationDetected(true);
        })
        .catch(() => {
          setLocationDetected(true);
        });
    } else if (!currentUser && !locationDetected) {
      // Not logged in: try IP-based geolocation via our API
      fetch(`${API_BASE}/api/geolocate`)
        .then(res => res.json())
        .then(data => {
          if (data.country && countries.includes(data.country)) {
            setSelectedCountry(data.country);
            setCountryFilter(data.country);
          }
          // If country not found or not in our list, keep "all"
          setLocationDetected(true);
        })
        .catch(() => {
          // IP geolocation failed, keep "all"
          setLocationDetected(true);
        });
    }
  }, [currentUser, locationDetected, countries]);

  // Filtered data with fuzzy search
  const filtered = users.filter((u) => {
    // Fuzzy search implementation
    const searchTerm = kw.toLowerCase().trim();
    const searchFields = [u.name, u.nickName, u.summary, u.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Simple fuzzy search - check if all search terms are present
    const kwOk = !searchTerm || searchTerm.split(' ').every(term =>
      searchFields.includes(term)
    );

    const categoryOk =
      !categoryFilter ||
      (u.category || "").toLowerCase() === categoryFilter.toLowerCase();

    const countryOk =
      !countryFilter ||
      (u.address?.country || "").toLowerCase() === countryFilter.toLowerCase();

    return kwOk && categoryOk && countryOk;
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
            <h4>Connect with talented freelancers who can deliver quality work.</h4>
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
              <button className="btn btn-light btn-lg mr-3 mb-2">
                <i className="fas fa-star"></i> Popular Skills
              </button>
              <select
                className="form-control form-control-lg d-inline-block w-auto mr-3 mb-2"
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ maxWidth: '200px' }}
              >
                <option value="all">All Categories</option>
                {categories.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                className="form-control form-control-lg d-inline-block w-auto"
                value={selectedCountry}
                onChange={handleCountryChange}
                style={{ maxWidth: '200px' }}
              >
                <option value="all">All Countries</option>
                {countries.map(name => (
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


    </>
  );
}

export default BrowsePage;
