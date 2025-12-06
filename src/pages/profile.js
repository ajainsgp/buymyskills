import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../utils/apiBase";
// import countries from "../data/countries.json";
import countryCodes from "../data/countryCodes.json";
import { validateMobile, validateSummary } from "../utils/validation";
import "./profile.css";
/* eslint-disable prettier/prettier */

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickName: "",
    emailId: "",
    secondaryEmail: "",
    countryCode: "+1",
    mobile: "",
    category: "",
    keywordTags: "",
    summary: "",
    workPreference: "",
    available: "",
    address: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
      country: "",
    },
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
    showInDashboard: false,
    showPhoto: false,
  });

  const [originalRoleType, setOriginalRoleType] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_IMAGE_BYTES = 500 * 1024;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);
  const [categories, setCategories] = useState([]);
  const [countriesWithCodes, setCountriesWithCodes] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-set currency code and mobile country code based on selected country
  useEffect(() => {
    if (form.address.country && countriesWithCodes.length > 0) {
      const selectedCountry = countriesWithCodes.find(
        (c) => c.name === form.address.country,
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
  }, [form.address.country, countriesWithCodes]);

  // Load current user (from localStorage first, then refresh from API)
  useEffect(() => {
    let ignore = false;
    async function init() {
      setError("");
      setNotice("");
      try {
        let cuRaw = localStorage.getItem("currentUser");
        if (!cuRaw && localStorage.getItem("rememberMe") !== "true") {
          cuRaw = sessionStorage.getItem("currentUser");
        }
        if (!cuRaw) {
          navigate("/login");
          return;
        }
        const cu = JSON.parse(cuRaw);
        if (!cu || !cu.id) {
          navigate("/login");
          return;
        }
        setUserId(cu.id);
        // Load photo if available
        try {
          const pr = await fetch(`${API_BASE}/api/users/${cu.id}/photo`);
          if (pr.ok) {
            const p = await pr.json().catch(() => ({}));
            if (p && p.contentType && p.base64) {
              setPhotoUrl(`data:${p.contentType};base64,${p.base64}`);
            }
          }
        } catch (e) {
          // ignore photo load errors
        }
        // Bootstrap form from localStorage so UI isn't blank
        setForm((prev) => ({
          ...prev,
          firstName: cu.firstName || "",
          lastName: cu.lastName || "",
          nickName: cu.nickName || "",
          emailId: cu.emailId || "",
          secondaryEmail: cu.secondaryEmail || "",
          countryCode: cu.countryCode || "+1",
          mobile: cu.mobile || "",
          category: cu.category || "",
          keywordTags: cu.keywordTags || "",
          summary: cu.summary || "",
          workPreference:
            cu.workPreference === "R"
              ? "Remote"
              : cu.workPreference === "OS"
                ? "On Site"
                : cu.workPreference === "H"
                  ? "Hybrid"
                  : cu.workPreference || "",
          available: cu.available || "Immediate",
          traveling: cu.traveling || "No Traveling",
          address: {
            addressLine1: cu.address?.addressLine1 || "",
            addressLine2: cu.address?.addressLine2 || "",
            city: cu.address?.city || "",
            state: cu.address?.state || "",
            postcode: cu.address?.postcode || "",
            country: cu.address?.country || "",
          },
          isWhatsappAvailable: cu.isWhatsappAvailable || false,
          whatsappNumber: cu.whatsappNumber || "",
          allowEmailContact: cu.allowEmailContact || false,
          allowMobileContact: cu.allowMobileContact || false,
          facebookUrl: cu.facebookUrl || "",
          linkedinUrl: cu.linkedinUrl || "",
          startingPrice: cu.startingPrice || "",
          negotiable: cu.negotiable || false,
          currencyCode: cu.currencyCode || "USD",
          rateType: cu.rateType || "D",
          roleType: cu.roleType || "user",
          showInDashboard: cu.showInDashboard,
          showPhoto: cu.showPhoto,
        }));

        // Refresh from backend (source of truth)
        const res = await fetch(`${API_BASE}/api/users/${cu.id}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.user) {
          const u = data.user;
          // Store original role type for validation
          setOriginalRoleType(u.roleType || "user");
          setForm({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            nickName: u.nickName || "",
            emailId: u.emailId || "",
            secondaryEmail: u.secondaryEmail || "",
            countryCode: u.countryCode || "+1",
            mobile: u.mobile || "",
            category: u.category || "",
            keywordTags: u.keywordTags || "",
            summary: u.summary || "",
            workPreference:
              u.workPreference === "R"
                ? "Remote"
                : u.workPreference === "OS"
                  ? "On Site"
                  : u.workPreference === "H"
                    ? "Hybrid"
                    : u.workPreference || "",
            available: u.available || "Immediate",
            traveling: u.traveling || "No Traveling",
            address: {
              addressLine1: u.address?.addressLine1 || "",
              addressLine2: u.address?.addressLine2 || "",
              city: u.address?.city || "",
              state: u.address?.state || "",
              postcode: u.address?.postcode || "",
              country: u.address?.country || "",
            },
            isWhatsappAvailable: u.isWhatsappAvailable || false,
            whatsappNumber: u.whatsappNumber || "",
            allowEmailContact: u.allowEmailContact || false,
            allowMobileContact: u.allowMobileContact || false,
            facebookUrl: u.facebookUrl || "",
            linkedinUrl: u.linkedinUrl || "",
            startingPrice: u.startingPrice || "",
            negotiable: u.negotiable || false,
            currencyCode: u.currencyCode || "USD",
            rateType: u.rateType || "D",
            roleType: u.roleType || "user",
            showInDashboard: u.showInDashboard,
            showPhoto: u.showPhoto,
          });
        }
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    init();

    // Load categories
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.categories)) {
        setCategories(data.categories.sort((a, b) => a.localeCompare(b)));
      }
      } catch {
        // ignore
      }
    }

    // Load countries with codes
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
  }, [navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: newValue },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: newValue }));

      // Real-time validation
      if (name === "mobile") {
        const validation = validateMobile(newValue, form.countryCode);
        setFieldErrors((prev) => ({
          ...prev,
          mobile: validation.message,
        }));
      } else if (name === "summary") {
        const validation = validateSummary(newValue);
        setFieldErrors((prev) => ({
          ...prev,
          summary: validation.message,
        }));
      }
    }
  };

  const onCancel = (e) => {
    e.preventDefault();
    navigate(-1);
  };

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
    reader.onload = async () => {
      try {
        setUploading(true);
        setPhotoError("");
        const dataUrl = reader.result;
        setPhotoUrl(dataUrl);
        if (!userId) return;
        await fetch(`${API_BASE}/api/users/${userId}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: dataUrl }),
        });
        setNotice("Photo uploaded successfully");

        // Notify other components that photo has been updated
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new Event("photo-updated"));
        }
      } catch (err) {
        setPhotoError("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setPhotoError("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const onSave = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!userId) {
      setError("Missing user id");
      return;
    }

    // Check if user is upgrading from buyer to seller
    const isUpgradingToSeller = originalRoleType === "buyer" && form.roleType === "user";
    if (isUpgradingToSeller) {
      // Validate required fields for seller upgrade
      if (!form.category || form.category.trim() === "") {
        setError("Category is required when upgrading to seller.");
        return;
      }
      if (!form.keywordTags || form.keywordTags.trim() === "") {
        setError("Tags are required when upgrading to seller.");
        return;
      }
      if (!form.startingPrice || form.startingPrice === "" || parseFloat(form.startingPrice) <= 0) {
        setError("Starting Price is required when upgrading to seller.");
        return;
      }
    }

    // Validation
    if (form.summary && form.summary.length > 150) {
      setError("Summary must be 100 characters or less");
      return;
    }
    // Validate mobile number based on country code
    if (form.mobile) {
      const mobileValidation = validateMobile(form.mobile, form.countryCode);
      if (!mobileValidation.isValid) {
        setError(mobileValidation.message);
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        nickName: form.nickName,
        secondaryEmail: form.secondaryEmail,
        countryCode: form.countryCode,
        mobile: form.mobile,
        isWhatsappAvailable: form.isWhatsappAvailable,
        whatsappNumber: form.whatsappNumber,
        allowEmailContact: form.allowEmailContact,
        allowMobileContact: form.allowMobileContact,
        facebookUrl: form.facebookUrl,
        linkedinUrl: form.linkedinUrl,
        category: form.category,
        keywordTags: form.keywordTags,
        summary: form.summary,
        workPreference: form.workPreference,
        available: form.available,
        traveling: form.traveling,
        startingPrice: form.startingPrice,
        negotiable: form.negotiable,
        currencyCode: form.currencyCode,
        rateType: form.rateType,
        roleType: form.roleType,
        showInDashboard: form.showInDashboard,
        showPhoto: form.showPhoto,
        address: { ...form.address },
      };
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          (data && data.error) || `Failed to update profile (${res.status})`;
        throw new Error(errMsg);
      }
      if (data.user) {
        try {
          // Keep name in the same derived shape as the rest of the app expects
          const updated = {
            ...data.user,
            name:
              data.user.name ||
              [data.user.firstName, data.user.lastName]
                .filter(Boolean)
                .join(" ")
                .trim(),
          };
          localStorage.setItem("currentUser", JSON.stringify(updated));
          try {
            // notify other components (Topbar listens to 'storage')
            window.dispatchEvent(new Event("storage"));
          } catch (e) {
            // ignore notification errors
          }
        } catch (e) {
          // ignore storage errors
        }
      }
      setNotice("Profile updated successfully");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid profile-loading">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="profile-container">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            My Profile id is{" "}
            <span className="text-primary font-weight-bold">{form.emailId}</span>
          </h1>
        </div>

        <form onSubmit={onSave}>

          <div className="row">
            <div className="col-lg-8">
              <div className="panel panel-body no-left-right-padding">
                <div className="panel panel-title">
                  <h3>My Basic Profile</h3>
                </div>

                    <div className="form-group row set-padding-left-right">
                  <div className="col-sm-12">
                    <div className="panel panel-info">
                      {form.roleType === "user" ? (
                        <div className="role-selection-with-label">
                          <div className="role-label">My Role is</div>
                          <div className="role-value">
                            <strong>Seller</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="role-selection-with-label">
                          <div className="role-label">My Role is</div>
                          <div className="role-options">
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="roleType"
                                id="buyer"
                                value="buyer"
                                checked={form.roleType === "buyer"}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  roleType: e.target.value
                                }))}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="buyer"
                              >
                                Buyer
                              </label>
                            </div>
                            <div className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="roleType"
                                id="seller"
                                value="user"
                                checked={form.roleType === "user"}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  roleType: e.target.value
                                }))}
                              />
                              <label className="form-check-label" htmlFor="seller">
                                Seller
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group row set-padding-left-right">
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

                <div className="form-group row set-padding-left-right">
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

                <div className="form-group row set-padding-left-right">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Address Line1</div>
                      <input
                        type="text"
                        name="address.addressLine1"
                        id="addressLine1"
                        className="form-control input-lg"
                        placeholder="Address Line1"
                        value={form.address.addressLine1}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Address Line2</div>
                      <input
                        type="text"
                        name="address.addressLine2"
                        id="addressLine2"
                        className="form-control input-lg"
                        placeholder="Address Line 2"
                        value={form.address.addressLine2}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group row set-padding-left-right">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">City</div>
                      <input
                        type="text"
                        name="address.city"
                        id="city"
                        className="form-control input-lg"
                        placeholder="City"
                        value={form.address.city}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">State</div>
                      <input
                        type="text"
                        name="address.state"
                        id="state"
                        className="form-control input-lg"
                        placeholder="State"
                        value={form.address.state}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group row set-padding-left-right">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Postcode</div>
                      <input
                        type="text"
                        name="address.postcode"
                        id="postcode"
                        className="form-control input-lg"
                        placeholder="PostCode"
                        value={form.address.postcode}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Country</div>
                      <select
                        id="country"
                        name="address.country"
                        className="custom-select"
                        value={form.address.country}
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
                  <h3>My Contact Details</h3>
                </div>

                <div className="form-group row set-padding-left-right">
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
                        if left blank then your primary email id will be used by
                        users to contact you
                      </small>
                    </div>
                  </div>
                </div>

                <div className="form-group row set-padding-left-right">
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
                            name="mobile"
                            id="mobileNo"
                            className="form-control"
                            placeholder="Mobile Number"
                            value={form.mobile}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                      {fieldErrors.mobile && (
                        <small className="form-text text-danger">
                          {fieldErrors.mobile}
                        </small>
                      )}
                      <div className="mt-2">
                        <div
                          className="form-check contact-preferences"
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

                <div className="form-group row set-padding-left-right">
                  <div className="col-sm-6">
                    <div className="panel panel-info">
                      <div className="panel-heading">
                        Contact Preferences
                      </div>
                      <div
                        className="form-check contact-preferences"
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
                  <div className="form-group row set-padding-left-right">
                    <div className="col-12">
                      <div className="alert alert-warning" role="alert">
                        <small>
                          <strong>Warning:</strong> You have disabled both email and mobile contact options.
                          Public users can only send messages within this app to contact you.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Only show Skills section for sellers */}
              {form.roleType === "user" && (
                <div className="panel panel-body no-left-right-padding">
                  <div className="panel panel-title">
                    <h3>My Skills</h3>
                  </div>

                  <div className="form-group row set-padding-left-right">
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

                  <div className="form-group row set-padding-left-right">
                    <div className="col-md-6">
                      <div className="panel panel-default">
                        <div className="panel-heading">
                          Tags * (Add up to 5 relevant tags)
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          id="keywordTags"
                          name="keywordTags"
                          placeholder="Like Software Development, Data Migration, AI & LLM Development"
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
                          Summary of your skills
                        </div>
                        <textarea
                          name="summary"
                          className="form-control"
                          placeholder="Briefly describe your key skills and expertise (150 characters)"
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
              {form.roleType === "user" && (
                <div className="panel panel-body no-left-right-padding">
                  <div className="panel panel-title">
                    <h3>My Pricing</h3>
                  </div>

                  <div className="form-group row set-padding-left-right">
                    <div className="col-md-6">
                      <div className="panel panel-default">
                        <div className="panel-heading">Starting Price</div>
                        <div className="row">
                          <div className="col-md-8">
                            <div className="input-group">
                              <div className="input-group-prepend">
                                <select
                                  name="currencyCode"
                                  className="custom-select currency-select"
                                  value={form.currencyCode}
                                  onChange={onChange}
                                  disabled
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
                          <div className="col-md-4 mt-2">
                            <div
                              className="form-check form-check-inline form-check-inline-margin"
                            >
                              <input
                                className="form-check-input"
                                type="radio"
                                name="rateType"
                                id="hourly"
                                value="H"
                                checked={form.rateType === "H"}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  rateType: e.target.value
                                }))}
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
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  rateType: e.target.value
                                }))}
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
                        <small className="form-text text-muted">
                          Your minimum hourly/daily rate
                        </small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="panel panel-default">
                        <div className="panel-heading">Negotiable</div>
                        <div className="negotiable-checkbox">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="negotiable"
                              id="negotiable"
                              checked={form.negotiable}
                              onChange={(e) => setForm(prev => ({
                                ...prev,
                                negotiable: e.target.checked
                              }))}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="negotiable"
                            >
                              Price is negotiable
                            </label>
                          </div>
                          <small className="form-text text-muted">
                            Check if you&apos;re open to negotiating your rates
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Only show Availability section for sellers */}
              {form.roleType === "user" && (
                <div className="panel panel-body no-left-right-padding">
                  <div className="panel panel-title">
                    <h3>My Availability</h3>
                  </div>

                  <div className="form-group row set-padding-left-right">
                    <div className="col-md-6">
                      <div className="panel panel-default">
                        <div className="panel-heading">Preference</div>
                        <select
                          id="workPreference"
                          name="workPreference"
                          className="custom-select"
                          value={form.workPreference || ""}
                          onChange={onChange}
                        >
                          <option value="">Select...</option>
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
                          value={form.traveling || ""}
                          onChange={onChange}
                        >
                          <option value="">Select...</option>
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
                        <div className="panel-heading">Available</div>
                        <select
                          id="available"
                          name="available"
                          className="custom-select"
                          value={form.available || ""}
                          onChange={onChange}
                        >
                          <option value="">Select...</option>
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

              {/* Only show Visibility section for sellers */}
              {form.roleType === "user" && (
                <div className="panel panel-body no-left-right-padding">
                  <div className="panel panel-title">
                    <h3>My Visibility</h3>
                  </div>
                  <div className="form-group row set-padding-left-right">
                    <div className="col-md-6">
                      <div className="panel panel-default">
                        <div className="panel-heading">
                          Show my profile on the public dashboard
                        </div>
                        <div className="checkbox visibility-checkbox">
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
                        <div className="checkbox visibility-checkbox">
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
              )}

              <div className="panel panel-body no-left-right-padding set-padding-top">
                <div className="form-group panel-body">
                  <button
                    className="btn btn-default"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    <i className="fa fa-fw fa-times" aria-hidden="true"></i>{" "}
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary update-button"
                    type="submit"
                    disabled={saving}
                  >
                    <i className="fa fa-fw fa-check" aria-hidden="true"></i>{" "}
                    {saving ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="panel panel-body no-left-right-padding">
                  <div
                    className="alert alert-danger alert-margin-bottom"
                    role="alert"
                  >
                    {error}
                  </div>
                </div>
              ) : null}
              {notice ? (
                <div className="panel panel-body no-left-right-padding">
                  <div
                    className="alert alert-success alert-margin-bottom"
                    role="alert"
                  >
                    {notice}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="col-lg-4">
              <div className="panel panel-body">
                <div className="panel panel-title">
                  <h3>Profile Photo</h3>
                </div>
                <div className="text-center">
                  <img
                    src={
                      photoUrl ||
                      "http://ssl.gstatic.com/accounts/ui/avatar_2x.png"
                    }
                    className="avatar img-circle img-thumbnail profile-photo"
                    alt="avatar"
                  />
                </div>
                <div className="text-center upload-button-container">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={onPickPhoto}
                    disabled={uploading || saving}
                  >
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  {photoUrl && photoUrl !== "http://ssl.gstatic.com/accounts/ui/avatar_2x.png" && (
                    <button
                      className="btn btn-danger remove-button"
                      type="button"
                      onClick={async () => {
                        try {
                          setUploading(true);
                          setPhotoError("");
                          if (userId) {
                            await fetch(`${API_BASE}/api/users/${userId}/photo`, {
                              method: "DELETE",
                            });
                          }
                          setPhotoUrl("");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                          setNotice("Photo removed successfully");
                        } catch (err) {
                          setPhotoError("Failed to remove photo");
                        } finally {
                          setUploading(false);
                        }
                      }}
                      disabled={uploading || saving}
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>{" "}
                      Remove Photo
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={onFileChange}
                  />
                  <div className="file-info">
                    Allowed types: .jpg, .jpeg, .png, .gif. Max size: 500KB.
                  </div>
                  {photoError ? (
                    <div className="photo-error">
                      {photoError}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
