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
    <>
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <Topbar />
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<DashboardContent2 />} />
            <Route path="/dashboard2" element={<DashboardContent2 />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/login" element={<LoginApps />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/readme" element={<ReadMe />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
