import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";
import API_BASE from "../../utils/apiBase";
import countries from "../../data/countries.json";

function RegisterUser() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nickName: "",
    gender: "M",
    mobileNo: "",
    emailId: "",
    secondaryEmail: "",
    password: "",
    keywords: "",
    workPreference: "Hybrid",
    traveling: "No Traveling",
    available: "Immediate",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  });

  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const fileInputRef = useRef(null);
  const [photoError, setPhotoError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const MAX_IMAGE_BYTES = 150 * 1024;
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
      setPhotoError("Image too large. Max 150KB");
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

    try {
      setSubmitting(true);
      // Use relative URL; CRA will proxy to http://localhost:4000 if "proxy" is set in package.json
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      navigate("/dashboard2");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div style={{ paddingBottom: "1.5rem" }}>
        {/* Page Heading */}
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-gray-800">Welcome to Buy My Skills</h1>
        </div>
        <div className="mainbody container-fluid">
          <div className="row">
            <div style={{ paddingTop: "50px" }} />
            <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1
                    className="panel-title pull-left"
                    style={{ fontSize: "30px" }}
                  >
                    <i className="fa fa-cogs" aria-hidden="true"></i> Register
                  </h1>
                </div>
              </div>

              <div className="panel panel-body">
                <div className="col-md-12">
                  <h3 className="panel-title">Your photo</h3>
                  <div>
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
                        className="btn btn-primary"
                        type="button"
                        onClick={onPickPhoto}
                        disabled={submitting}
                      >
                        <i className="fa fa-upload" aria-hidden="true"></i>{" "}
                        Upload a new profile photo
                      </button>
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
                        Allowed types: .jpg, .jpeg, .png, .gif. Max size: 150KB.
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
                  <div className="panel panel-body">
                    <div className="panel panel-title">
                      <h3>My basic profile</h3>
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
                            tabIndex="1"
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
                            tabIndex="2"
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
                            tabIndex="3"
                            value={form.nickName}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group row">
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

                  <div className="panel panel-body">
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
                            tabIndex="5"
                            value={form.emailId}
                            onChange={onChange}
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
                          <input
                            type="text"
                            name="mobileNo"
                            id="mobileNo"
                            className="form-control input-lg"
                            placeholder="Mobile Number"
                            tabIndex="4"
                            value={form.mobileNo}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>

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
                            tabIndex="6"
                            value={form.password}
                            onChange={onChange}
                          />
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
                  </div>

                  <div className="panel panel-body">
                    <div className="panel panel-title">
                      <h3>My Skills</h3>
                    </div>

                    <div className="form-group row">
                      <div className="col-md-6">
                        <div className="panel panel-default">
                          <div className="panel-heading">
                            Describe yourself in 5 words
                          </div>
                          <input
                            type="text"
                            className="form-control"
                            id="keywords"
                            name="keywords"
                            placeholder="Like #movies #kittens #travel #teacher #newyork"
                            value={form.keywords}
                            onChange={onChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel panel-body">
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

                  <div className="panel panel-body">
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
                            tabIndex="7"
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
                            tabIndex="8"
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
                            tabIndex="9"
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
                            tabIndex="10"
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
                            tabIndex="11"
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
                            {countries.map((c) => (
                              <option key={c.code} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <div className="panel panel-body">
                      <div
                        className="alert alert-danger"
                        role="alert"
                        style={{ marginBottom: 0 }}
                      >
                        {error}
                      </div>
                    </div>
                  ) : null}

                  <div className="panel panel-body">
                    <div className="form-group">
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
                        disabled={submitting}
                      >
                        <i className="fa fa-fw fa-check" aria-hidden="true"></i>{" "}
                        {submitting ? "Registering..." : "Register Profile"}
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
