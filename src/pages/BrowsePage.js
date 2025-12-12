/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useRef } from "react";
import API_BASE from "../utils/apiBase";
import UserProfile from "../components/UserProfile";
import { useLocation, useSearchParams } from "react-router-dom";
import { getCountries } from "../utils/countryUtils";
import { useTranslation } from "react-i18next";

function BrowsePage() {
  const { t } = useTranslation();
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
  const [cityFilter, setCityFilter] = useState("");
  const [searchKw, setSearchKw] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
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

    // Load countries using utility function
    getCountries(false)
      .then(countryList => {
        // Store both name and code for dropdown and filtering
        setCountries(countryList);
      })
      .catch(err => console.error("Error fetching countries:", err));
  }, [searchParams]);



  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCategoryFilter(value === "all" ? "" : value);
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountry(value);
    setCountryFilter(value === "all" ? "" : value);
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleCityChange = (e) => {
    setCityFilter(e.target.value);
    setCurrentPage(1);
    loadUsers(1);
  };

  const loadUsers = React.useCallback(async (page = 1) => {
    const mySeq = (reqSeqRef.current += 1);
    setLoading(true);
    try {
      const limit = itemsPerPage;
      const offset = (page - 1) * itemsPerPage;

      // Check if user is admin
      const isAdmin = currentUser && (String(currentUser.roleType || "").toLowerCase() === "administrative" ||
                      String(currentUser.roleType || "").toLowerCase() === "administrator");

      let endpoint, headers;
      if (isAdmin) {
        // For admins: show all active users across all categories and countries
        endpoint = `${API_BASE}/api/users?roleType=user&limit=${limit}&offset=${offset}`;
        headers = {};
      } else if (currentUser) {
        // For regular logged-in users: region-filtered users
        endpoint = `${API_BASE}/api/users/public?limit=${limit}&offset=${offset}`;
        headers = { 'x-current-user': JSON.stringify(currentUser) };
      } else {
        // For non-logged-in users: show all users (limited view)
        endpoint = `${API_BASE}/api/users?roleType=user&limit=${limit}&offset=${offset}`;
        headers = {};
      }

      const res = await fetch(endpoint, {
        cache: "no-store",
        headers: headers
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          (data && data.error) || `Failed to load users (${res.status})`;
        throw new Error(errMsg);
      }
      if (mySeq === reqSeqRef.current) {
        const newUsers = Array.isArray(data.users) ? data.users : [];
        if (page === 1) {
          setUsers(newUsers);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
        }
        setHasMore(data.pagination ? data.pagination.totalPages > page : false);
        setError("");
      }
    } catch (err) {
      if (mySeq === reqSeqRef.current) {
        setError(err.message || "Failed to load users");
      }
    } finally {
      if (mySeq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser, itemsPerPage]);

  const handleLoadMore = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    loadUsers(newPage);
  };

  const handleSearch = () => {
    setKw(searchKw);
    setCurrentPage(1);
    loadUsers(1);
  };

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  useEffect(() => {
    function handleAuth() {
      setCurrentPage(1);
      loadUsers(1);
    }
    function handleStorage(e) {
      if (!e || e.key === "currentUser") {
        setCurrentPage(1);
        loadUsers(1);
      }
    }
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
  }, [loadUsers]);

  // Reload when route changes (e.g., after login redirects)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
  }, [location.pathname]);

  // Set available countries based on user region and auto-set default country
  useEffect(() => {
    const setupUserRegionAndCountry = async () => {
      // Check if user is admin
      const isAdmin = currentUser && (String(currentUser.roleType || "").toLowerCase() === "administrative" ||
                      String(currentUser.roleType || "").toLowerCase() === "administrator");

      if (isAdmin && countries.length > 0) {
        // For admins: show all countries
        setAvailableCountries(countries);
        setLocationDetected(true);
      } else if (currentUser && countries.length > 0) {
        try {
          // Get user's region
          const regionRes = await fetch(`${API_BASE}/api/users/region`, {
            headers: {
              'x-current-user': JSON.stringify(currentUser)
            }
          });
          const regionData = await regionRes.json();

          if (regionData.region) {
            // Get countries in user's region
            const regionCountriesRes = await fetch(`${API_BASE}/api/user-region/countries`, {
              headers: {
                'x-current-user': JSON.stringify(currentUser)
              }
            });
            const regionCountriesData = await regionCountriesRes.json();

            if (regionCountriesData.countries && regionCountriesData.countries.length > 0) {
              // Filter countries to only those in user's region
              const regionCountryCodes = regionCountriesData.countries;
              const availableCountriesList = countries.filter(c =>
                regionCountryCodes.includes(c.name)
              );
              setAvailableCountries(availableCountriesList);

              // Auto-set user's country if not already set
              if (!countrySetRef.current && selectedCountry === "all") {
                // Get user's country code
                const userRes = await fetch(`${API_BASE}/api/users/${currentUser.id}`);
                const userData = await userRes.json();
                if (userData.user && userData.user.countryCode) {
                  const userCountryCode = userData.user.countryCode;
                  // Check if user's country is in their region
                  if (availableCountriesList.find(c => c.code === userCountryCode)) {
                    setSelectedCountry(userCountryCode);
                    setCountryFilter(userCountryCode);
                  }
                  countrySetRef.current = true;
                }
              }
            } else {
              // Fallback to all countries if region logic fails
              setAvailableCountries(countries);
            }
          } else {
            // Fallback to all countries if no region found
            setAvailableCountries(countries);
          }
        } catch (err) {
          console.error("Error setting up region and country:", err);
          // Fallback to all countries
          setAvailableCountries(countries);
        }
        setLocationDetected(true);
      } else if (!currentUser && countries.length > 0) {
        // Not logged in: show all countries, try IP-based geolocation
        setAvailableCountries(countries);

        if (!locationDetected) {
          fetch(`${API_BASE}/api/geolocate`)
            .then(res => res.json())
            .then(data => {
              if (data.countryCode && countries.find(c => c.code === data.countryCode)) {
                setSelectedCountry(data.countryCode);
                setCountryFilter(data.countryCode);
              }
              setLocationDetected(true);
            })
            .catch(() => {
              setLocationDetected(true);
            });
        }
      }
    };

    setupUserRegionAndCountry();
  }, [currentUser, countries, selectedCountry, locationDetected]);

  // Filtered data with fuzzy search
  const filtered = users.filter((u) => {
    // Fuzzy search implementation
    const searchTerm = kw.toLowerCase().trim();
    const searchFields = [u.name, u.nickName, u.summary, u.category, u.keywordTags]
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

    // Filter by country code instead of country name
    const countryOk =
      !countryFilter ||
      !u.countryCode ||
      String(u.countryCode || "").toLowerCase() === countryFilter.toLowerCase();

    const cityOk =
      !cityFilter.trim() ||
      !u.city ||
      (u.city || "").toLowerCase().includes(cityFilter.toLowerCase().trim());

    return kwOk && categoryOk && countryOk && cityOk;
  });

  const displayUsers = filtered;

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <div className="container-fluid">
          <div className="text-center">
            <h1 className="display-4 font-weight-bold mb-4">
              {t("browse.title")}
            </h1>
            <h4>{t("browse.subtitle")}</h4>
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder={t("browse.searchPlaceholder")}
                    aria-label={t("browse.searchPlaceholder")}
                    value={searchKw}
                    onChange={(e) => setSearchKw(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button className="btn btn-primary btn-lg" type="button" onClick={handleSearch}>
                      <i className="fas fa-search"></i> {t("browse.searchButton")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="row">
                <div className="col-12 col-sm-6 col-md-3 mb-3">
                  <button className="btn btn-light btn-lg w-100">
                    <i className="fas fa-star"></i> {t("browse.popularSkills")}
                  </button>
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-3">
                  <select
                    className="form-control form-control-lg w-100"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    <option value="all">{t("browse.allCategories")}</option>
                    {categories.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-3">
                  <select
                    className="form-control form-control-lg w-100"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                  >
                    <option value="all">{t("browse.allCountries")}</option>
                    {availableCountries.map(country => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3 mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg w-100"
                    placeholder={t("browse.cityPlaceholder")}
                    value={cityFilter}
                    onChange={handleCityChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section className="py-5">
        <div className="container">
          {loading && <div className="text-center">{t("browse.loading")}</div>}
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
                  <p>{t("browse.noUsersFound")}</p>
                </div>
              )}
            </div>
          )}
          {hasMore && !loading && displayUsers.length > 0 && (
            <div className="text-center mt-4">
              <button className="btn btn-primary" onClick={handleLoadMore}>
                {t("browse.loadMore")}
              </button>
            </div>
          )}
        </div>
      </section>


    </>
  );
}

export default BrowsePage;
