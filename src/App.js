import React, { useEffect } from "react";
import Layout from "./components/Layout";
import DashboardContent2 from "./pages/dashboardContent2";
import { Route, Routes, Navigate } from "react-router-dom";
import RegisterUser from "./components/register/register";
import LoginApps from "./components/login/login";
import Profile from "./pages/profile";
import UpdatePassword from "./components/auth/UpdatePassword";
import AdminCategories from "./pages/AdminCategories";
import AdminCountries from "./pages/AdminCountries";
import AdminLandingPageCards from "./pages/AdminLandingPageCards";
import ReadMe from "./pages/ReadMe";
import HowItWorks from "./pages/HowItWorks";
import Feedback from "./pages/Feedback";
import AdminFeedback from "./pages/AdminFeedback";
import AdminRegions from "./pages/AdminRegions";
import Users from "./pages/Users";
import Messages from "./pages/Messages";
import MyEngagedList from "./pages/MyEngagedList";
import LandingPage from "./pages/LandingPage";
import BrowsePage from "./pages/BrowsePage";
import AboutUs from "./pages/AboutUs";
import { LandingPageCardsProvider } from "./contexts/LandingPageCardsContext";
import "./i18n";

function App() {
  // On initial load, ensure no auto-login unless user explicitly chose "Remember Me"
  useEffect(() => {
    try {
      if (localStorage.getItem("rememberMe") !== "true") {
        localStorage.removeItem("currentUser");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Session timeout management
  useEffect(() => {
    let timeoutId;
    let lastActivity = Date.now();

    const resetActivity = () => {
      lastActivity = Date.now();
    };

    const checkTimeout = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const sessionTimeoutMinutes =
        parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 15;
      const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000; // Convert to milliseconds

      if (timeSinceActivity >= sessionTimeoutMs) {
        // Auto logout
        sessionStorage.removeItem("currentUser");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("rememberMe");
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new Event("auth-changed"));
        }
        // Navigate to home
        if (typeof window !== "undefined" && window.location) {
          window.location.href = "/home";
        }
      }
    };

    // Set up activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetActivity, true);
    });

    // Check for timeout every minute
    const startTimeoutCheck = () => {
      timeoutId = setInterval(checkTimeout, 60000); // Check every minute
    };

    // Only start timeout check if user is logged in
    const checkIfLoggedIn = () => {
      try {
        const currentUser =
          sessionStorage.getItem("currentUser") ||
          (localStorage.getItem("rememberMe") === "true"
            ? localStorage.getItem("currentUser")
            : null);
        if (currentUser && JSON.parse(currentUser)) {
          startTimeoutCheck();
        }
      } catch {
        // ignore
      }
    };

    checkIfLoggedIn();

    // Listen for auth changes to start/stop timeout
    const handleAuthChange = () => {
      clearInterval(timeoutId);
      checkIfLoggedIn();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "currentUser") {
        handleAuthChange();
      }
    });

    return () => {
      clearInterval(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetActivity, true);
      });
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  return (
    <LandingPageCardsProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={
            <Layout>
              <LandingPage />
            </Layout>
          }
        />
        <Route
          path="/about-us"
          element={
            <Layout>
              <AboutUs />
            </Layout>
          }
        />
        <Route
          path="/browse"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <BrowsePage />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <DashboardContent2 />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/dashboard2"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <DashboardContent2 />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <RegisterUser />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <LoginApps />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <Profile />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/update-password"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <UpdatePassword />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <AdminCategories />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/admin/countries"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <AdminCountries />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/admin/landing-page-cards"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <AdminLandingPageCards />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <AdminFeedback />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/admin/regions"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <AdminRegions />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/users"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <Users />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/messages"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <Messages />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/feedback"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <Feedback />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/my-engaged-list"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <MyEngagedList />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/how-it-works"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <HowItWorks />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
        <Route
          path="/readme"
          element={
            <Layout>
              <div id="wrapper">
                <div id="content-wrapper" className="d-flex flex-column">
                  <div id="content">
                    <ReadMe />
                  </div>
                </div>
              </div>
            </Layout>
          }
        />
      </Routes>
    </LandingPageCardsProvider>
  );
}

export default App;
