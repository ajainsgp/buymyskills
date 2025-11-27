import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../utils/apiBase";
import countries from "../data/countries.json";
import countryCodes from "../data/countryCodes.json";
import { validateMobile, validateSummary } from "../utils/validation";
/* eslint-disable prettier/prettier */

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    summary: "",
    workPreference: "",
    availability: "",
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
    facebookUrl: "",
    linkedinUrl: "",
  });

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_IMAGE_BYTES = 250 * 1024;
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);
  const [categories, setCategories] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load current user (from localStorage first, then refresh from API)
  useEffect(() => {
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
          summary: cu.summary || "",
          workPreference:
            cu.workPreference === "R"
              ? "Remote"
              : cu.workPreference === "OS"
                ? "On Site"
                : cu.workPreference === "H"
                  ? "Hybrid"
                  : cu.workPreference || "",
          availability:
            cu.availability === "0"
              ? "Immediate"
              : cu.availability === "1"
                ? "In 1 month"
                : cu.availability === "2"
                  ? "In 2 months"
                  : cu.availability === "3"
                    ? "In 3 months"
                    : cu.availability || "",
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
          facebookUrl: cu.facebookUrl || "",
          linkedinUrl: cu.linkedinUrl || "",
        }));

        // Refresh from backend (source of truth)
        const res = await fetch(`${API_BASE}/api/users/${cu.id}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.user) {
          const u = data.user;
          setForm({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            nickName: u.nickName || "",
            emailId: u.emailId || "",
            secondaryEmail: u.secondaryEmail || "",
            countryCode: u.countryCode || "+1",
            mobile: u.mobile || "",
            category: u.category || "",
            summary: u.summary || "",
            workPreference:
              u.workPreference === "R"
                ? "Remote"
                : u.workPreference === "OS"
                  ? "On Site"
                  : u.workPreference === "H"
                    ? "Hybrid"
                    : u.workPreference || "",
            availability:
              u.availability === "0"
                ? "Immediate"
                : u.availability === "1"
                  ? "In 1 month"
                  : u.availability === "2"
                    ? "In 2 months"
                    : u.availability === "3"
                      ? "In 3 months"
                      : u.availability || "",
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
            facebookUrl: u.facebookUrl || "",
            linkedinUrl: u.linkedinUrl || "",
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
    loadCategories();
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));

      // Real-time validation
      if (name === "mobile") {
        const validation = validateMobile(value, form.countryCode);
        setFieldErrors((prev) => ({
          ...prev,
          mobile: validation.message,
        }));
      } else if (name === "summary") {
        const validation = validateSummary(value);
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
      setPhotoError("Image too large. Max 250KB");
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

    // Validation
    if (form.summary && form.summary.length > 100) {
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
        facebookUrl: form.facebookUrl,
        linkedinUrl: form.linkedinUrl,
        category: form.category,
        summary: form.summary,
        workPreference: form.workPreference,
        availability: form.availability,
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
      <div className="container-fluid" style={{ padding: "1rem" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">My Profile</h1>
        </div>

        <form onSubmit={onSave}>
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="alert alert-success" role="alert">
              {notice}
            </div>
          ) : null}

          <div className="row">
            <div className="col-lg-8">
              <div className="panel panel-body">
                <div className="panel panel-title">
                  <h3>Basic Info</h3>
                </div>

                <div className="form-group row">
                  <div className="col-sm-6">
                    <div className="panel panel-info">
                      <div className="panel-heading">First Name</div>
                      <input
                        type="text"
                        name="firstName"
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
                        className="form-control input-lg"
                        placeholder="Nick Name"
                        value={form.nickName}
                        onChange={onChange}
                      />
                    </div>
                  </div>
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
                        className="form-control input-lg"
                        placeholder="you@example.com"
                        value={form.emailId}
                        readOnly
                        aria-readonly="true"
                      />
                      <small className="form-text text-muted">
                        this email id cannot be changed once registered with
                        this id
                      </small>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="panel panel-info">
                      <div className="panel-heading">Mobile</div>
                      <div className="row">
                        <div className="col-4">
                          <select
                            name="countryCode"
                            className="form-control"
                            value={form.countryCode || "+1"}
                            onChange={onChange}
                          >
                            {countryCodes.filter((country) => country.enabled === "Y").map((country) => (
                              <option key={country.iso} value={country.code}>
                                {country.code} ({country.name})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-8">
                          <input
                            type="text"
                            name="mobile"
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
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="isWhatsappAvailable"
                            id="isWhatsappAvailable"
                            checked={form.isWhatsappAvailable}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              isWhatsappAvailable: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor="isWhatsappAvailable">
                            This number is available on WhatsApp
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
                            Enter your WhatsApp number if different from above
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
                        Secondary email Id to contact (optional)
                      </div>
                      <input
                        type="email"
                        name="secondaryEmail"
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

                <div className="form-group row">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Facebook URL (optional)</div>
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
                      <div className="panel-heading">LinkedIn URL (optional)</div>
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

                <div className="form-group row">
                  <div className="col-sm-6">
                    <div className="panel panel-info">
                      <div className="panel-heading">Category</div>
                      <select
                        name="category"
                        className="custom-select"
                        value={form.category || ""}
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
                  <div className="col-md-12">
                    <div className="panel panel-default">
                      <div className="panel-heading">Summary of your skills</div>
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
                    </div>
                  </div>
                </div>

                <div className="form-group row">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Work Preference</div>
                      <select
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
                      <div className="panel-heading">Availability</div>
                      <select
                        name="availability"
                        className="custom-select"
                        value={form.availability || ""}
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

                <div className="panel panel-title">
                  <h3>Address</h3>
                </div>
                <div className="form-group row">
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Address Line 1</div>
                      <input
                        type="text"
                        name="address.addressLine1"
                        className="form-control input-lg"
                        placeholder="Address Line 1"
                        value={form.address.addressLine1}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Address Line 2</div>
                      <input
                        type="text"
                        name="address.addressLine2"
                        className="form-control input-lg"
                        placeholder="Address Line 2"
                        value={form.address.addressLine2}
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
                        name="address.city"
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
                        className="form-control input-lg"
                        placeholder="State"
                        value={form.address.state}
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
                        name="address.postcode"
                        className="form-control input-lg"
                        placeholder="Postcode"
                        value={form.address.postcode}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="panel panel-default">
                      <div className="panel-heading">Country</div>
                      <select
                        name="address.country"
                        className="form-control input-lg"
                        value={form.address.country}
                        onChange={onChange}
                      >
                        <option value="">Select...</option>
                        {countries.filter((c) => c.enabled === "Y").map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="panel panel-body">
                  <div className="form-group set-padding-top">
                    <button
                      className="btn btn-default"
                      onClick={onCancel}
                      disabled={saving}
                    >
                      <i className="fa fa-fw fa-times" aria-hidden="true"></i>{" "}
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={saving}
                      style={{ marginLeft: 8 }}
                    >
                      <i className="fa fa-fw fa-check" aria-hidden="true"></i>{" "}
                      {saving ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - avatar/info (optional) */}
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
                    className="avatar img-circle img-thumbnail"
                    alt="avatar"
                    style={{ maxWidth: 160 }}
                  />
                </div>
                <div className="text-center" style={{ marginTop: 12 }}>
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
                      className="btn btn-danger"
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
                      style={{ marginLeft: "10px" }}
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
                  <div style={{ fontSize: 12, color: "#777", marginTop: 8 }}>
                    Allowed types: .jpg, .jpeg, .png, .gif. Max size: 250KB.
                  </div>
                  {photoError ? (
                    <div style={{ fontSize: 12, color: "#c00", marginTop: 4 }}>
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
