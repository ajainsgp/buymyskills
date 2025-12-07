import { PhoneNumberUtil } from "google-libphonenumber";
import countryCodes from "../data/countryCodes.json";

// Initialize the phone number utility
const phoneUtil = PhoneNumberUtil.getInstance();

// Create a mapping from calling code to ISO code
const callingCodeToIso = {};
countryCodes.forEach((country) => {
  callingCodeToIso[country.code] = country.iso;
});

/**
 * Validates mobile number format using Google libphonenumber
 * @param {string} mobile - Mobile number to validate
 * @param {string} countryCode - Country code (e.g., "+65" for Singapore)
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateMobile = (mobile, countryCode = "+1") => {
  if (!mobile || mobile.trim() === "") {
    return { isValid: true, message: "" }; // Optional field, empty is ok
  }

  try {
    // Remove country code prefix if present in the mobile number
    let cleanMobile = mobile.replace(/\s+/g, "").replace(/[-()]/g, "");

    // If the mobile number already includes the country code, remove it
    if (cleanMobile.startsWith("+")) {
      // Extract just the number part after the country code
      const phoneNumber = phoneUtil.parse(cleanMobile, "");
      cleanMobile = phoneNumber.getNationalNumber().toString();
    }

    // Get the ISO country code from the calling code
    const isoCode = callingCodeToIso[countryCode] || "US"; // Default to US if not found

    // Parse the phone number with the ISO country code
    const phoneNumber = phoneUtil.parse(cleanMobile, isoCode);

    // Check if the number is valid
    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return {
        isValid: false,
        message: "Please enter a valid mobile number for the selected country",
      };
    }

    // Check if it's a mobile number (not fixed line)
    const numberType = phoneUtil.getNumberType(phoneNumber);
    if (numberType !== 1) {
      // MOBILE = 1
      return {
        isValid: false,
        message: "Please enter a valid mobile phone number",
      };
    }

    return { isValid: true, message: "" };
  } catch (error) {
    return {
      isValid: false,
      message: "Please enter a valid mobile number for the selected country",
    };
  }
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
      message: `Summary must be 150 characters or less (${summary.length}/150)`,
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
