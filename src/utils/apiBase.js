/* eslint-disable no-undef */
/**
 * API base URL for the frontend to call the backend.
 * Uses env override if set (REACT_APP_API_BASE_URL), otherwise defaults to http://localhost:4000.
 * This avoids reliance on CRA proxy so the app works on ports like 3000, 3001, etc.
 */
const API_BASE =
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_API_BASE_URL
    ? process.env.REACT_APP_API_BASE_URL
    : `http://${window.location.hostname}:4000`;

export default API_BASE;
