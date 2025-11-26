// Validation utility functions

// Mobile number digit requirements by country code
const MOBILE_LENGTHS = {
  "+1": { min: 10, max: 10 }, // US/Canada
  "+44": { min: 10, max: 11 }, // UK
  "+91": { min: 10, max: 10 }, // India
  "+65": { min: 8, max: 8 }, // Singapore
  "+353": { min: 9, max: 10 }, // Ireland
  // Default for other countries
  default: { min: 7, max: 15 },
};

/**
 * Validates mobile number format based on country code
 * @param {string} mobile - Mobile number to validate
 * @param {string} countryCode - Country code (e.g., '+65' for Singapore)
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateMobile = (mobile, countryCode = "+1") => {
  if (!mobile || mobile.trim() === "") {
    return { isValid: true, message: "" }; // Optional field, empty is ok
  }

  const cleanMobile = mobile.replace(/\s+/g, "").replace(/[-()]/g, "");

  // Get digit requirements for the country
  const lengthReq = MOBILE_LENGTHS[countryCode] || MOBILE_LENGTHS.default;

  if (
    cleanMobile.length < lengthReq.min ||
    cleanMobile.length > lengthReq.max
  ) {
    return {
      isValid: false,
      message: `Mobile number must be ${
        lengthReq.min
      }${lengthReq.min !== lengthReq.max ? `-${lengthReq.max}` : ""} digits for this country`,
    };
  }

  // Check if it's all digits
  if (!/^\d+$/.test(cleanMobile)) {
    return {
      isValid: false,
      message: "Mobile number can only contain digits",
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validates summary field (150 characters)
 * @param {string} summary - Summary text to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateSummary = (summary) => {
  if (!summary || summary.trim() === "") {
    return { isValid: true, message: "" }; // Optional field
  }

  if (summary.length > 150) {
    return {
      isValid: false,
      message: `Summary must be 100 characters or less (${summary.length}/150)`,
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validates password strength (min 8 chars, 1 number, 1 special char)
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password || password.trim() === "") {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for at least one number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { isValid: true, message: "" };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validates required text fields
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === "") {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true, message: "" };
};
