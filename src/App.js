import React, { useEffect } from "react";
import Topbar from "./components/topbar/topbar";
import DashboardContent2 from "./pages/dashboardContent2";
import { Route, Routes, Navigate } from "react-router-dom";
import RegisterUser from "./components/register/register";
import LoginApps from "./components/login/login";
import Profile from "./pages/profile";
import UpdatePassword from "./components/auth/UpdatePassword";
import AdminCategories from "./pages/AdminCategories";
import ReadMe from "./pages/ReadMe";
import LandingPage from "./pages/LandingPage";
import BrowsePage from "./pages/BrowsePage";

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

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route
        path="/home"
        element={
          <>
            <Topbar />
            <LandingPage />
          </>
        }
      />
      <Route
        path="/browse"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <BrowsePage />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/dashboard"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <DashboardContent2 />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/dashboard2"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <DashboardContent2 />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/register"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <RegisterUser />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/login"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <LoginApps />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/profile"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <Profile />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/update-password"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <UpdatePassword />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <AdminCategories />
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/readme"
        element={
          <div id="wrapper">
            <div id="content-wrapper" className="d-flex flex-column">
              <div id="content">
                <Topbar />
                <ReadMe />
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
