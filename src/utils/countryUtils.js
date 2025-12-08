import API_BASE from "./apiBase";
import countryCodesData from "../data/countryCodes.json";

// Cache for API data
let cachedCountries = null;
let cachedCountriesWithCodes = null;

/**
 * Get countries list based on the persistence mode
 * @param {boolean} withCodes - Whether to include ISD codes (for phone number selection)
 * @returns {Promise<Array>} Array of country objects
 */
export const getCountries = async (withCodes = false) => {
  // Check if we're in DB mode by trying to fetch from API
  // If API fails, fall back to JSON file (filesystem mode)
  try {
    const endpoint = withCodes
      ? `${API_BASE}/api/countries-with-codes`
      : `${API_BASE}/api/countries`;
    const response = await fetch(endpoint);

    if (response.ok) {
      const data = await response.json();

      // Cache the result
      if (withCodes) {
        cachedCountriesWithCodes = data.countries || [];
        return cachedCountriesWithCodes;
      } else {
        cachedCountries = data.countries || [];
        return cachedCountries;
      }
    } else {
      // API not available, fall back to JSON
      throw new Error("API not available");
    }
  } catch (error) {
    // Fall back to JSON file (filesystem mode)
    console.log("Using filesystem mode for countries:", error.message);

    if (withCodes) {
      if (!cachedCountriesWithCodes) {
        // Transform JSON data to match API format
        cachedCountriesWithCodes = countryCodesData
          .filter((country) => country.enabled === "Y")
          .map((country) => ({
            name: country.name,
            code: country.iso,
            isdCode: country.isdCode,
            currencyCode: "", // Not available in JSON
            enabled: true,
          }));
      }
      return cachedCountriesWithCodes;
    } else {
      if (!cachedCountries) {
        // Transform JSON data to match API format
        cachedCountries = countryCodesData
          .filter((country) => country.enabled === "Y")
          .map((country) => ({
            name: country.name,
            code: country.iso,
            isdCode: country.isdCode,
            currencyCode: "", // Not available in JSON
          }));
      }
      return cachedCountries;
    }
  }
};

/**
 * Get country code mapping for validation (synchronous)
 * @returns {Object} Mapping of ISD codes to ISO codes
 */
export const getCountryCodeMapping = () => {
  const mapping = {};
  countryCodesData.forEach((country) => {
    if (country.enabled === "Y") {
      mapping[country.isdCode] = country.iso;
    }
  });
  return mapping;
};
