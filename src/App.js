import React from "react";
import Topbar from "./components/topbar/topbar";
import DashboardContent2 from "./pages/dashboardContent2";
import { Route, Routes } from "react-router-dom";
import RegisterUser from "./components/register/register";
import LoginApps from "./components/login/login";
import Profile from "./pages/profile";
import UpdatePassword from "./components/auth/UpdatePassword";

function App() {
  return (
    <>
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <Topbar />
          <Routes>
            <Route path="/home" element={<DashboardContent2 />} />
            <Route path="/dashboard2" element={<DashboardContent2 />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/login" element={<LoginApps />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/update-password" element={<UpdatePassword />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
