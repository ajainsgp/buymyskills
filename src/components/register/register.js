import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./register.css";
import API_BASE from "../../utils/apiBase";
import { getCountries } from "../../utils/countryUtils";
import {
  validateEmail,
  validateMobile,
  validateSummary,
  validatePassword,
} from "../../utils/validation";

function RegisterUser() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    keywordTags: "",
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
        const countries = await getCountries(true);
        if (!ignore) {
          setCountriesWithCodes(countries);
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
        if (selectedCountry.isdCode) {
          setForm((prev) => ({
            ...prev,
            countryCode: selectedCountry.isdCode,
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

    // Handle country selection specially to update countryCode synchronously
    if (name === "country" && countriesWithCodes.length > 0) {
      const selectedCountry = countriesWithCodes.find(
        (c) => c.name === newValue,
      );
      if (selectedCountry) {
        setForm((prev) => ({
          ...prev,
          [name]: newValue,
          countryCode: selectedCountry.isdCode,
          currencyCode: selectedCountry.currencyCode || prev.currencyCode,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [name]: newValue,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }

    // Real-time validation
    if (name === "emailId") {
      const validation = validateEmail(newValue);
      setFieldErrors((prev) => ({
        ...prev,
        emailId: validation.message,
      }));
    } else if (name === "mobileNo") {
      // For mobile validation, use the updated countryCode if country was just changed
      let currentCountryCode = form.countryCode;
      if (name === "country" && countriesWithCodes.length > 0) {
        const selectedCountry = countriesWithCodes.find(
          (c) => c.name === newValue,
        );
        if (selectedCountry) {
          currentCountryCode = selectedCountry.isdCode;
        }
      }
      const validation = validateMobile(newValue, currentCountryCode);
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
    } else if (name === "whatsappNumber") {
      if (newValue && newValue.trim() !== "") {
        // For WhatsApp validation, use the updated countryCode if country was just changed
        let currentCountryCode = form.countryCode;
        if (name === "country" && countriesWithCodes.length > 0) {
          const selectedCountry = countriesWithCodes.find(
            (c) => c.name === newValue,
          );
          if (selectedCountry) {
            currentCountryCode = selectedCountry.isdCode;
          }
        }
        const validation = validateMobile(newValue, currentCountryCode);
        setFieldErrors((prev) => ({
          ...prev,
          whatsappNumber: validation.message,
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          whatsappNumber: "",
        }));
      }
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
    if (form.summary && form.summary.length > 150) {
      setError("Summary must be 150 characters or less");
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

    // Validate WhatsApp number if provided
    if (form.whatsappNumber && form.whatsappNumber.trim() !== "") {
      const whatsappValidation = validateMobile(
        form.whatsappNumber,
        form.countryCode,
      );
      if (!whatsappValidation.isValid) {
        setError(`WhatsApp number: ${whatsappValidation.message}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      // Find the selected country to get its code
      const selectedCountry = countriesWithCodes.find(
        (c) => c.name === form.country,
      );
      const countryCode = selectedCountry ? selectedCountry.isdCode : "+1";

      const payload = {
        ...form,
        countryCode, // Add country code for users table
        address: { ...form.address }, // Keep address for address table
      };
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

      // Show success message before navigating
      setSuccess("Your profile has been created successfully!");
      setTimeout(() => {
        navigate("/home");
      }, 3000); // Navigate after 3 seconds
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
              {t("auth.register.pageTitle")}
            </h1>
          </div>
        </div>
        <div className="mainbody container-fluid">
          <div className="row">
            <div style={{ paddingTop: "50px" }} />
            <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
              <div className="panel panel-body">
                <div className="col-md-12 no-left-right-padding">
                  <h3 className="panel-title">
                    {t("auth.register.profilePhoto")}
                  </h3>
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
                        {t("auth.register.uploadPhoto")}
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
                      <h3>{t("auth.register.basicProfile")}</h3>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-12">
                        <div className="panel panel-info">
                          <div className="role-selection-with-label">
                            <div className="role-label">
                              {t("auth.register.iWantTo")}
                            </div>
                            <div className="role-options">
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
                                  {t("auth.register.becomeSeller")}
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
                                <label
                                  className="form-check-label"
                                  htmlFor="buyer"
                                >
                                  {t("auth.register.becomeBuyer")}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.firstName")}
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            id="first_name"
                            className="form-control input-lg"
                            placeholder={t("auth.register.firstName")}
                            value={form.firstName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.lastName")}
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            id="last_name"
                            className="form-control input-lg"
                            placeholder={t("auth.register.lastName")}
                            value={form.lastName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.addressLine1")}
                          </div>
                          <input
                            type="text"
                            name="addressLine1"
                            id="addressLine1"
                            className="form-control input-lg"
                            placeholder={t("auth.register.addressLine1")}
                            value={form.addressLine1}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.addressLine2")}
                          </div>
                          <input
                            type="text"
                            name="addressLine2"
                            id="addressLine2"
                            className="form-control input-lg"
                            placeholder={t("auth.register.addressLine2")}
                            value={form.addressLine2}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.city")}
                          </div>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            className="form-control input-lg"
                            placeholder={t("auth.register.city")}
                            value={form.city}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.state")}
                          </div>
                          <input
                            type="text"
                            name="state"
                            id="state"
                            className="form-control input-lg"
                            placeholder={t("auth.register.state")}
                            value={form.state}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.postcode")}
                          </div>
                          <input
                            type="text"
                            name="postcode"
                            id="postcode"
                            className="form-control input-lg"
                            placeholder={t("auth.register.postcode")}
                            value={form.postcode}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            {t("auth.register.country")}
                          </div>
                          <select
                            id="country"
                            name="country"
                            className="custom-select"
                            value={form.country}
                            onChange={onChange}
                          >
                            <option value="">Select...</option>
                            {countriesWithCodes
                              .filter((c) => c.name)
                              .map((c) => (
                                <option key={c.name} value={c.name}>
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
                      <h3>{t("auth.register.contactDetails")}</h3>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.email")}
                          </div>
                          <input
                            type="email"
                            name="emailId"
                            id="emailId"
                            className="form-control input-lg"
                            placeholder={t("auth.register.email")}
                            value={form.emailId}
                            onChange={onChange}
                          />
                          {fieldErrors.emailId && (
                            <small className="form-text text-danger">
                              {fieldErrors.emailId}
                            </small>
                          )}
                          <small className="form-text text-muted">
                            {t("auth.register.emailHelp")}
                          </small>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.secondaryEmail")}
                          </div>
                          <input
                            type="email"
                            name="secondaryEmail"
                            id="secondaryEmail"
                            className="form-control input-lg"
                            placeholder={t("auth.register.email")}
                            value={form.secondaryEmail}
                            onChange={onChange}
                          />
                          <small className="form-text text-muted">
                            {t("auth.register.secondaryEmailHelp")}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.mobile")}
                          </div>
                          <div className="row">
                            <div className="col-4">
                              <select
                                name="countryCode"
                                className="form-control"
                                value={form.countryCode}
                                onChange={onChange}
                                disabled
                              >
                                {countriesWithCodes
                                  .filter((country) => country.name)
                                  .map((country) => (
                                    <option
                                      key={country.name}
                                      value={country.isdCode}
                                    >
                                      {country.isdCode} ({country.name})
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
                                placeholder={t("auth.register.mobileNumber")}
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
                            <div className="form-check">
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
                                {t("auth.register.whatsappAvailable")}
                              </label>
                            </div>
                          </div>
                          {!form.isWhatsappAvailable && (
                            <div className="mt-2">
                              <input
                                type="text"
                                name="whatsappNumber"
                                className="form-control"
                                placeholder={t("auth.register.whatsappNumber")}
                                value={form.whatsappNumber}
                                onChange={onChange}
                              />
                              {fieldErrors.whatsappNumber && (
                                <small className="form-text text-danger">
                                  {fieldErrors.whatsappNumber}
                                </small>
                              )}
                              <small className="form-text text-muted">
                                {t("auth.register.whatsappHelp")}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.contactPreferences")}
                          </div>
                          <div className="form-check">
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
                              {t("auth.register.allowEmailContact")}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.contactPreferences")}
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
                              {t("auth.register.allowMobileContact")}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!form.allowEmailContact && !form.allowMobileContact && (
                      <div className="form-group row set-padding-left-right">
                        <div className="col-12">
                          <div className="alert alert-warning" role="alert">
                            <small>
                              <strong>{t("auth.register.warning")}:</strong>{" "}
                              {t("auth.register.contactWarning")}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-group row set-padding-left-right">
                      <div className="col-sm-6">
                        <div className="panel panel-info">
                          <div className="panel-heading">
                            {t("auth.register.password")}
                          </div>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            className="form-control input-lg"
                            placeholder={t("auth.register.password")}
                            value={form.password}
                            onChange={onChange}
                          />
                          <small className="form-text text-muted">
                            {t("auth.register.passwordHelp")}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Only show Skills section for sellers */}
                  {form.userRole === "seller" && (
                    <div className="panel panel-body no-left-right-padding">
                      <div className="panel panel-title">
                        <h3>{t("auth.register.skills")}</h3>
                      </div>

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.category")}
                            </div>
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

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.tags")}
                            </div>
                            <input
                              type="text"
                              className="form-control"
                              id="keywordTags"
                              name="keywordTags"
                              placeholder={t("auth.register.tagsPlaceholder")}
                              value={form.keywordTags}
                              onChange={onChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-12">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.summary")}
                            </div>
                            <textarea
                              name="summary"
                              className="form-control"
                              placeholder={t(
                                "auth.register.summaryPlaceholder",
                              )}
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

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.facebookUrl")}
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
                              {t("auth.register.facebookHelp")}
                            </small>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.linkedinUrl")}
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
                              {t("auth.register.linkedinHelp")}
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
                        <h3>{t("auth.register.pricing")}</h3>
                      </div>

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.startingPrice")}
                            </div>
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
                                    placeholder={t(
                                      "auth.register.startingPricePlaceholder",
                                    )}
                                    value={form.startingPrice}
                                    onChange={onChange}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4 mt-2">
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
                                    {t("auth.register.hourly")}
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
                                    {t("auth.register.daily")}
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
                            <div className="panel-heading">
                              {t("auth.register.negotiable")}
                            </div>
                            <div className="mt-2">
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
                                  {t("auth.register.priceNegotiable")}
                                </label>
                              </div>
                              <small className="form-text text-muted">
                                {t("auth.register.negotiableHelp")}
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
                        <h3>{t("auth.register.availability")}</h3>
                      </div>

                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.preference")}
                            </div>
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
                            <div className="panel-heading">
                              {t("auth.register.traveling")}
                            </div>
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
                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.available")}
                            </div>
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

                  {success ? (
                    <div className="panel panel-body no-left-right-padding">
                      <div
                        className="alert alert-success"
                        role="alert"
                        style={{ marginBottom: 0 }}
                      >
                        <i
                          className="fa fa-check-circle"
                          aria-hidden="true"
                        ></i>{" "}
                        {success}
                      </div>
                    </div>
                  ) : null}

                  {/* Only show Visibility section for sellers */}
                  {form.userRole === "seller" && (
                    <div className="panel panel-body no-left-right-padding">
                      <div className="panel panel-title">
                        <h3>{t("auth.register.visibility")}</h3>
                      </div>
                      <div className="form-group row set-padding-left-right">
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.showInDashboard")}
                            </div>
                            <div
                              className="checkbox"
                              style={{ padding: "10px" }}
                            >
                              <label>
                                <input
                                  type="checkbox"
                                  name="showInDashboard"
                                  checked={form.showInDashboard}
                                  onChange={onChange}
                                />{" "}
                                {t("auth.register.allowDashboard")}
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="panel panel-default">
                            <div className="panel-heading">
                              {t("auth.register.showPhoto")}
                            </div>
                            <div
                              className="checkbox"
                              style={{ padding: "10px" }}
                            >
                              <label>
                                <input
                                  type="checkbox"
                                  name="showPhoto"
                                  checked={form.showPhoto}
                                  onChange={onChange}
                                />{" "}
                                {t("auth.register.allowPhoto")}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="panel no-left-right-padding">
                    <div className="alert alert-info">
                      <strong>{t("auth.register.privacyNotice")}:</strong>{" "}
                      {t("auth.register.privacyText")}
                    </div>
                  </div>

                  <div className="panel panel-body no-left-right-padding">
                    <div
                      className="form-group"
                      style={{ padding: "10px", marginBottom: 0 }}
                    >
                      <div className="checkbox">
                        <label>
                          <input
                            type="checkbox"
                            name="confirmInfo"
                            checked={confirmInfo}
                            onChange={(e) => setConfirmInfo(e.target.checked)}
                            required
                          />{" "}
                          {t("auth.register.confirmInfo")}
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
                        {t("auth.register.cancel")}
                      </button>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={submitting || !confirmInfo}
                      >
                        <i className="fa fa-fw fa-check" aria-hidden="true"></i>{" "}
                        {submitting
                          ? t("auth.register.registering")
                          : t("auth.register.registerProfile")}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              <div style={{ paddingBottom: 24 }}>
                {t("auth.register.haveAccount")}{" "}
                <a href="/login">{t("auth.register.signIn")}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;
