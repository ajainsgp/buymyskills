import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";
import API_BASE from "../../utils/apiBase";
import countries from "../../data/countries.json";
import countryCodes from "../../data/countryCodes.json";
import {
  validateEmail,
  validateMobile,
  validateSummary,
  validatePassword,
} from "../../utils/validation";

function RegisterUser() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickName: "",
    gender: "M",
    countryCode: "+1",
    mobileNo: "",
    emailId: "",
    secondaryEmail: "",
    password: "",
    keywords: "",
    summary: "",
    workPreference: "Hybrid",
    traveling: "No Traveling",
    available: "Immediate",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    category: "",
    showInDashboard: true,
    showPhoto: true,
    isWhatsappAvailable: false,
    whatsappNumber: "",
    allowEmailContact: false,
    allowMobileContact: false,
    facebookUrl: "",
    linkedinUrl: "",
    startingPrice: "",
    negotiable: false,
    currencyCode: "USD",
    rateType: "D",
    userRole: "seller", // "seller", "buyer"
  });

  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const fileInputRef = useRef(null);
  const [photoError, setPhotoError] = useState("");
  const [categories, setCategories] = useState([]);
  const [countriesWithCodes, setCountriesWithCodes] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmInfo, setConfirmInfo] = useState(false);
  const [categoryPriceRange, setCategoryPriceRange] = useState(null);
  const [loadingPriceRange, setLoadingPriceRange] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.categories) && !ignore) {
          setCategories(data.categories.sort((a, b) => a.localeCompare(b)));
        }
      } catch {
        // ignore fetch errors
      }
    }

    async function loadCountriesWithCodes() {
      try {
        const res = await fetch(`${API_BASE}/api/countries-with-codes`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.countries) && !ignore) {
          setCountriesWithCodes(data.countries);
        }
      } catch {
        // ignore fetch errors
      }
    }

    loadCategories();
    loadCountriesWithCodes();
    return () => {
      ignore = true;
    };
  }, []);

  // Auto-set currency code and mobile country code based on selected country
  useEffect(() => {
    if (form.country && countriesWithCodes.length > 0) {
      const selectedCountry = countriesWithCodes.find(
        (c) => c.name === form.country,
      );
      if (selectedCountry) {
        // Auto-set currency code
        if (selectedCountry.currencyCode) {
          setForm((prev) => ({
            ...prev,
            currencyCode: selectedCountry.currencyCode,
          }));
        }
        // Auto-set mobile country code
        if (selectedCountry.phoneCode) {
          setForm((prev) => ({
            ...prev,
            countryCode: selectedCountry.phoneCode,
          }));
        }
      }
    }
  }, [form.country, countriesWithCodes]);

  // Fetch price range when category changes
  useEffect(() => {
    const fetchPriceRange = async () => {
      if (form.category) {
        setLoadingPriceRange(true);
        try {
          const response = await fetch(
            `${API_BASE}/api/categories/${encodeURIComponent(form.category)}/price-range?currency=${encodeURIComponent(form.currencyCode)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setCategoryPriceRange(data);
          } else {
            setCategoryPriceRange(null);
          }
        } catch (error) {
          console.error("Error fetching price range:", error);
          setCategoryPriceRange(null);
        } finally {
          setLoadingPriceRange(false);
        }
      } else {
        setCategoryPriceRange(null);
      }
    };

    fetchPriceRange();
  }, [form.category]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Real-time validation
    if (name === "emailId") {
      const validation = validateEmail(newValue);
      setFieldErrors((prev) => ({
        ...prev,
        emailId: validation.message,
      }));
    } else if (name === "mobileNo") {
      const validation = validateMobile(newValue, form.countryCode);
      setFieldErrors((prev) => ({
        ...prev,
        mobileNo: validation.message,
      }));
    } else if (name === "summary") {
      const validation = validateSummary(newValue);
      setFieldErrors((prev) => ({
        ...prev,
        summary: validation.message,
      }));
    } else if (name === "password") {
      const validation = validatePassword(newValue);
      setFieldErrors((prev) => ({
        ...prev,
        password: validation.message,
      }));
    }
  };

  const MAX_IMAGE_BYTES = 500 * 1024;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

  const onPickPhoto = (e) => {
    e.preventDefault();
    setPhotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setPhotoError("Invalid file type. Allowed: JPG, PNG, GIF");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError("Image too large. Max 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoError("");
      setPhotoDataUrl(reader.result);
    };
    reader.onerror = () => {
      setPhotoError("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.emailId || !form.password) {
      setError("First name, Email and Password are required.");
      return;
    }

    // Validation
    if (form.summary && form.summary.length > 100) {
      setError("Summary must be 100 characters or less");
      return;
    }
    // Validate mobile number based on country code
    if (form.mobileNo) {
      const mobileValidation = validateMobile(form.mobileNo, form.countryCode);
      if (!mobileValidation.isValid) {
        setError(mobileValidation.message);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = { ...form };
      // Use relative URL; CRA will proxy to http://localhost:4000 if "proxy" is set in package.json
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Registration failed (${res.status})`);
      }

      const data = await res.json();
      // Optionally persist currentUser for later use
      try {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      } catch {
        // ignore storage errors
      }
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("auth-changed"));
      }
      if (photoDataUrl) {
        try {
          await fetch(`${API_BASE}/api/users/${data.user.id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64: photoDataUrl }),
          });
        } catch (e) {
          // ignore upload errors
        }
      }
      navigate("/home");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setForm((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        {/* Page Heading */}
        <div className="bg-primary text-white py-3 mb-4">
          <div className="container">
            <h1 className="h3 mb-0 text-center">
              Register your skills to the world of opportunities waiting for you
            </h1>
          </div>
        </div>
        <div className="mainbody container-fluid">
          <div className="row">
            <div style={{ paddingTop: "50px" }} />
            <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
              <div className="panel panel-body">
                <div className="col-md-12 no-left-right-padding">
                  <h3 className="panel-title">My Profile photo</h3>
                  <div className="text-center">
                    <div className="col-lg-12 col-md-12">
                      <img
                        src={
                          photoDataUrl ||
                          "http://ssl.gstatic.com/accounts/ui/avatar_2x.png"
                        }
                        className="avatar img-circle img-thumbnail"
                        alt="avatar"
                      />
                    </div>
                    <br />
                    <div className="col-lg-12 col-md-12">
                      <button
                        className="btn btn-primary set-margin-bottom"
                        type="button"
                        onClick={onPickPhoto}
                        disabled={submitting}
                      >
                        <i className="fa fa-upload" aria-hidden="true"></i>{" "}
                        Upload a new profile photo
                      </button>
                      {photoDataUrl && (
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl("");
                            setPhotoError("");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          disabled={submitting}
                          style={{ marginLeft: "10px" }}
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>{" "}
                          Remove Photo
                        </button>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={onFileChange}
                      />
                      <div
                        style={{ fontSize: 12, color: "#777", marginTop: 8 }}
                      >
                        Allowed types: .jpg, .jpeg, .png, .gif. Max size: 500KB.
                      </div>
                      {photoError ? (
                        <div
                          style={{ fontSize: 12, color: "#c00", marginTop: 4 }}
                        >
                          {photoError}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-9 col-md-9 col-sm-12 col-xs-12">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="panel panel-body no-left-right-padding">
                    <div className="panel panel-title">
                      <h3>My basic Profile</h3>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-12">
                        <div className="panel panel-info">
                          <div className="panel-heading">I want to</div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="userRole"
                              id="seller"
                              value="seller"
                              checked={form.userRole === "seller"}
                              onChange={onChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="seller"
                            >
                              Become a Seller
                            </label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="userRole"
                              id="buyer"
                              value="buyer"
                              checked={form.userRole === "buyer"}
                              onChange={onChange}
                            />
                            <label className="form-check-label" htmlFor="buyer">
                              Become a Buyer
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">First Name</div>
                          <input
                            type="text"
                            name="firstName"
                            id="first_name"
                            className="form-control input-lg"
                            placeholder="First Name"
                            value={form.firstName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">Last Name</div>
                          <input
                            type="text"
                            name="lastName"
                            id="last_name"
                            className="form-control input-lg"
                            placeholder="Last Name"
                            value={form.lastName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">Nick Name</div>
                          <input
                            type="text"
                            name="nickName"
                            id="nick_name"
                            className="form-control input-lg"
                            placeholder="Nick Name to display as"
                            value={form.nickName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">Gender</div>
                          <select
                            id="gender"
                            name="gender"
                            className="custom-select"
                            value={form.gender}
                            onChange={onChange}
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel panel-body no-left-right-padding">
                    <div className="panel panel-title">
                      <h3>My Location</h3>
                    </div>

                    <div className="form-group row">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">Address Line1</div>
                          <input
                            type="text"
                            name="addressLine1"
                            id="addressLine1"
                            className="form-control input-lg"
                            placeholder="Address Line1"
                            value={form.addressLine1}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">Address Line2</div>
                          <input
                            type="text"
                            name="addressLine2"
                            id="addressLine2"
                            className="form-control input-lg"
                            placeholder="Address Line 2"
                            value={form.addressLine2}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">City</div>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            className="form-control input-lg"
                            placeholder="City"
                            value={form.city}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">State</div>
                          <input
                            type="text"
                            name="state"
                            id="state"
                            className="form-control input-lg"
                            placeholder="State"
                            value={form.state}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">Postcode</div>
                          <input
                            type="text"
                            name="postcode"
                            id="postcode"
                            className="form-control input-lg"
                            placeholder="PostCode"
                            value={form.postcode}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">Country</div>
                          <select
                            id="country"
                            name="country"
                            className="custom-select"
                            value={form.country}
                            onChange={onChange}
                          >
                            <option value="">Select...</option>
                            {countries
                              .filter((c) => c.enabled === "Y")
                              .map((c) => (
                                <option key={c.code} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel panel-body no-left-right-padding">
                    <div className="panel panel-title">
                      <h3>My Contact Details</h3>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            Your email Id to login
                          </div>
                          <input
                            type="email"
                            name="emailId"
                            id="emailId"
                            className="form-control input-lg"
                            placeholder="you@example.com"
                            value={form.emailId}
                            onChange={onChange}
                          />
                          {fieldErrors.emailId && (
                            <small className="form-text text-danger">
                              {fieldErrors.emailId}
                            </small>
                          )}
                          <small className="form-text text-muted">
                            this email id cannot be changed once registered with
                            this id
                          </small>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            Secondary email Id to contact (optional)
                          </div>
                          <input
                            type="email"
                            name="secondaryEmail"
                            id="secondaryEmail"
                            className="form-control input-lg"
                            placeholder="secondary@example.com"
                            value={form.secondaryEmail}
                            onChange={onChange}
                          />
                          <small className="form-text text-muted">
                            if left blank then your primary email id will be
                            used by users to contact you
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">Mobile</div>
                          <div className="row">
                            <div className="col-4">
                              <select
                                name="countryCode"
                                className="form-control"
                                value={form.countryCode}
                                onChange={onChange}
                                disabled
                              >
                                {countryCodes
                                  .filter((country) => country.enabled === "Y")
                                  .map((country) => (
                                    <option
                                      key={country.iso}
                                      value={country.code}
                                    >
                                      {country.code} ({country.name})
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div className="col-8">
                              <input
                                type="text"
                                name="mobileNo"
                                id="mobileNo"
                                className="form-control"
                                placeholder="Mobile Number"
                                value={form.mobileNo}
                                onChange={onChange}
                              />
                            </div>
                          </div>
                          {fieldErrors.mobileNo && (
                            <small className="form-text text-danger">
                              {fieldErrors.mobileNo}
                            </small>
                          )}
                          <div className="mt-2">
                            <div
                              className="form-check"
                              style={{ margin: "10px" }}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="isWhatsappAvailable"
                                id="isWhatsappAvailable"
                                checked={form.isWhatsappAvailable}
                                onChange={onChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="isWhatsappAvailable"
                              >
                                This number is also available on WhatsApp
                              </label>
                            </div>
                          </div>
                          {!form.isWhatsappAvailable && (
                            <div className="mt-2">
                              <input
                                type="text"
                                name="whatsappNumber"
                                className="form-control"
                                placeholder="WhatsApp Contact Number"
                                value={form.whatsappNumber}
                                onChange={onChange}
                              />
                              <small className="form-text text-muted">
                                Enter your WhatsApp number if different from
                                above
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            Contact Preferences
                          </div>
                          <div
                            className="form-check"
                            style={{ margin: "10px" }}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="allowEmailContact"
                              id="allowEmailContact"
                              checked={form.allowEmailContact}
                              onChange={onChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="allowEmailContact"
                            >
                              Allow public to contact me on my email address
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            Contact Preferences
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="allowMobileContact"
                              id="allowMobileContact"
                              checked={form.allowMobileContact}
                              onChange={onChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="allowMobileContact"
                            >
                              Allow public to contact me on my mobile number
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!form.allowEmailContact && !form.allowMobileContact && (
                      <div className="form-group row">
                        <div className="col-12">
                          <div className="alert alert-warning" role="alert">
                            <medium>
                              <strong>Warning:</strong> You have disabled both
                              email and mobile contact options. Users can only
                              send messages within this app to contact you.
                            </medium>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-group row">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">Password</div>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            className="form-control input-lg"
                            placeholder="Password"
                            value={form.password}
                            onChange={onChange}
                          />
                          <small className="form-text text-muted">
                            Password must be at least 8 characters long and
                            contain at least one number and one special
                            character.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Only show Skills section for sellers */}
                  {form.userRole === "seller" && (
                    <div className="panel panel-body no-left-right-padding">
                      <div className="panel panel-title">
                        <h3>My Skills</h3>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Category</div>
                            <select
                              id="category"
                              name="category"
                              className="custom-select"
                              value={form.category}
                              onChange={onChange}
                            >
                              <option value="">Select...</option>
                              {categories.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              Tags * (Add up to 5 relevant tags)
                            </div>
                            <input
                              type="text"
                              className="form-control"
                              id="keywords"
                              name="keywords"
                              placeholder="Like Software Development, Data Migration, AI & LLM Development"
                              value={form.keywords}
                              onChange={onChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-12">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              Summary of your skills
                            </div>
                            <textarea
                              name="summary"
                              className="form-control"
                              placeholder="Briefly describe your key skills and expertise (max 150 characters)"
                              value={form.summary}
                              onChange={onChange}
                              maxLength={150}
                              rows={3}
                            />
                            <small className="form-text text-muted">
                              {form.summary.length}/150 characters
                            </small>
                            {fieldErrors.summary && (
                              <small className="form-text text-danger">
                                {fieldErrors.summary}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              Facebook URL (optional)
                            </div>
                            <input
                              type="url"
                              name="facebookUrl"
                              className="form-control"
                              placeholder="https://facebook.com/yourprofile"
                              value={form.facebookUrl}
                              onChange={onChange}
                            />
                            <small className="form-text text-muted">
                              Your Facebook profile or page URL
                            </small>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              LinkedIn URL (optional)
                            </div>
                            <input
                              type="url"
                              name="linkedinUrl"
                              className="form-control"
                              placeholder="https://linkedin.com/in/yourprofile"
                              value={form.linkedinUrl}
                              onChange={onChange}
                            />
                            <small className="form-text text-muted">
                              Your LinkedIn profile URL
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Only show Pricing section for sellers */}
                  {form.userRole === "seller" && (
                    <div className="panel panel-body no-left-right-padding">
                      <div className="panel panel-title">
                        <h3>My Pricing</h3>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Starting Price</div>
                            <div className="row">
                              <div className="col-md-8">
                                <div className="input-group">
                                  <div className="input-group-prepend">
                                    <select
                                      name="currencyCode"
                                      className="custom-select"
                                      value={form.currencyCode}
                                      onChange={onChange}
                                      disabled
                                      style={{ minWidth: "80px" }}
                                    >
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                      <option value="GBP">GBP</option>
                                      <option value="INR">INR</option>
                                      <option value="SGD">SGD</option>
                                      <option value="AUD">AUD</option>
                                      <option value="CAD">CAD</option>
                                    </select>
                                  </div>
                                  <input
                                    type="number"
                                    name="startingPrice"
                                    className="form-control"
                                    placeholder="Enter starting price"
                                    value={form.startingPrice}
                                    onChange={onChange}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div
                                  className="form-check form-check-inline"
                                  style={{ marginRight: "15px" }}
                                >
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="rateType"
                                    id="hourly"
                                    value="H"
                                    checked={form.rateType === "H"}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        rateType: e.target.value,
                                      }))
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="hourly"
                                  >
                                    Hourly
                                  </label>
                                </div>
                                <div className="form-check form-check-inline">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="rateType"
                                    id="daily"
                                    value="D"
                                    checked={form.rateType === "D"}
                                    onChange={(e) =>
                                      setForm((prev) => ({
                                        ...prev,
                                        rateType: e.target.value,
                                      }))
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor="daily"
                                  >
                                    Daily
                                  </label>
                                </div>
                              </div>
                            </div>
                            {/* <small className="form-text text-muted">
                            Your minimum hourly/daily rate
                          </small> */}
                            {/* Price Range Display */}
                            {form.category && categoryPriceRange && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  padding: "8px",
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "4px",
                                  border: "1px solid #dee2e6",
                                }}
                              >
                                <small
                                  style={{
                                    color: "#495057",
                                    fontWeight: "bold",
                                  }}
                                >
                                  💰 Market Rate Range for {form.category}:
                                </small>
                                <div style={{ marginTop: "4px" }}>
                                  {categoryPriceRange.hourly.min !== null &&
                                    categoryPriceRange.hourly.max !== null && (
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#6c757d",
                                        }}
                                      >
                                        <strong>Hourly:</strong>{" "}
                                        {form.currencyCode}{" "}
                                        {categoryPriceRange.hourly.min} -{" "}
                                        {form.currencyCode}{" "}
                                        {categoryPriceRange.hourly.max}
                                      </div>
                                    )}
                                  {categoryPriceRange.daily.min !== null &&
                                    categoryPriceRange.daily.max !== null && (
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#6c757d",
                                          marginTop: "2px",
                                        }}
                                      >
                                        <strong>Daily:</strong>{" "}
                                        {form.currencyCode}{" "}
                                        {categoryPriceRange.daily.min} -{" "}
                                        {form.currencyCode}{" "}
                                        {categoryPriceRange.daily.max}
                                      </div>
                                    )}
                                  {(categoryPriceRange.hourly.min === null ||
                                    categoryPriceRange.daily.min === null) && (
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#868e96",
                                        fontStyle: "italic",
                                        marginTop: "2px",
                                      }}
                                    >
                                      Limited data available for this category
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {loadingPriceRange && form.category && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  padding: "8px",
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "4px",
                                }}
                              >
                                <small style={{ color: "#6c757d" }}>
                                  Loading market rates...
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Negotiable</div>
                            <div style={{ padding: "10px" }}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name="negotiable"
                                  id="negotiable"
                                  checked={form.negotiable}
                                  onChange={onChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="negotiable"
                                >
                                  Price is negotiable
                                </label>
                              </div>
                              <small className="form-text text-muted">
                                Check if you&apos;re open to negotiating your
                                rates
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Only show Availability section for sellers */}
                  {form.userRole === "seller" && (
                    <div className="panel panel-body no-left-right-padding">
                      <div className="panel panel-title">
                        <h3>My Availability</h3>
                      </div>

                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Preference</div>
                            <select
                              id="workPreference"
                              name="workPreference"
                              className="custom-select"
                              value={form.workPreference}
                              onChange={onChange}
                            >
                              <option value="Remote">Remote</option>
                              <option value="On Site">On Site</option>
                              <option value="Hybrid">Hybrid</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Traveling</div>
                            <select
                              id="traveling"
                              name="traveling"
                              className="custom-select"
                              value={form.traveling}
                              onChange={onChange}
                            >
                              <option value="No Traveling">No Traveling</option>
                              <option value="25%">25%</option>
                              <option value="50%">50%</option>
                              <option value="100%">100%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="form-group row">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">Available</div>
                            <select
                              id="available"
                              name="available"
                              className="custom-select"
                              value={form.available}
                              onChange={onChange}
                            >
                              <option value="Immediate">Immediate</option>
                              <option value="In 1 month">In 1 month</option>
                              <option value="In 2 months">In 2 months</option>
                              <option value="In 3 months">In 3 months</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error ? (
                    <div className="panel panel-body no-left-right-padding">
                      <div
                        className="alert alert-danger"
                        role="alert"
                        style={{ marginBottom: 0 }}
                      >
                        {error}
                      </div>
                    </div>
                  ) : null}

                  <div className="panel panel-body no-left-right-padding">
                    <div className="panel panel-title">
                      <h3>Visibility</h3>
                    </div>
                    <div className="form-group row">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            Show my profile on the public dashboard
                          </div>
                          <div className="checkbox" style={{ padding: "10px" }}>
                            <label>
                              <input
                                type="checkbox"
                                name="showInDashboard"
                                checked={form.showInDashboard}
                                onChange={onChange}
                              />{" "}
                              Allow my profile to appear on the dashboard
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            Show my photo publicly
                          </div>
                          <div className="checkbox" style={{ padding: "10px" }}>
                            <label>
                              <input
                                type="checkbox"
                                name="showPhoto"
                                checked={form.showPhoto}
                                onChange={onChange}
                              />{" "}
                              Allow my uploaded photo to be shown
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel no-left-right-padding">
                    <div className="alert alert-info">
                      <strong>Privacy Notice:</strong> We may use your IP
                      address to detect your approximate location for providing
                      location-based features. This information is not stored
                      permanently and is only used to enhance your browsing
                      experience.
                    </div>
                  </div>

                  <div className="panel panel-body no-left-right-padding">
                    <div className="form-group" style={{ padding: "10px" }}>
                      <div className="checkbox">
                        <label>
                          <input
                            type="checkbox"
                            name="confirmInfo"
                            checked={confirmInfo}
                            onChange={(e) => setConfirmInfo(e.target.checked)}
                            required
                          />{" "}
                          I confirm that all the information provided above is
                          correct and up-to-date to the best of my knowledge.
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="panel panel-body no-left-right-padding set-padding-top">
                    <div className="form-group panel-body">
                      <button
                        className="btn btn-default"
                        onClick={handleCancel}
                        disabled={submitting}
                      >
                        <i className="fa fa-fw fa-times" aria-hidden="true"></i>{" "}
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={submitting || !confirmInfo}
                      >
                        <i className="fa fa-fw fa-check" aria-hidden="true"></i>{" "}
                        {submitting ? "Registering..." : "Register my Profile"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              <div style={{ paddingBottom: 24 }}>
                Already have an account? <a href="/login">Login here</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;
