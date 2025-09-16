import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavItemsDropdownAlert from "./navItemsDropdownAlert";
import NavItemsDropdownMenu from "./navItemsDropdownMenu";
import topbarMenuItemsData from "../../data/topbarMenuItems.json";
import alertMessageData from "../../data/alertMessages.json";

function Topbar() {
  const alertMessages = alertMessageData.alertMessages;
  const menuItems = topbarMenuItemsData.menuItems;
  const guestMenuItems = [
    {
      menuItemIcon: "fa-sign-in-alt",
      menuItemName: "Login",
      showDivider: false,
    },
    {
      menuItemIcon: "fa-user-plus",
      menuItemName: "Register",
      showDivider: false,
    },
  ];

  const navigate = useNavigate();
  const [userName, setUserName] = useState("Guest");
  const [isAuthed, setIsAuthed] = useState(false);
  const itemsToUse = isAuthed ? menuItems : guestMenuItems;
  const location = useLocation();

  const sync = () => {
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (cu) {
        const name =
          cu.name ||
          [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
          cu.emailId ||
          "User";
        setUserName(name);
        setIsAuthed(true);
      } else {
        setUserName("Guest");
        setIsAuthed(false);
      }
    } catch {
      setUserName("Guest");
      setIsAuthed(false);
    }
  };

  useEffect(() => {
    // initial sync and cross-tab sync
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  useEffect(() => {
    // when route changes after login/logout, resync in this tab
    sync();
  }, [location.pathname]);

  const handleMenuSelect = (menuName) => {
    if (menuName === "Logout") {
      try {
        localStorage.removeItem("currentUser");
      } catch (e) {
        // ignore
      }
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("auth-changed"));
      }
      navigate("/login");
      return;
    }
    if (menuName === "Profile") {
      navigate("/profile");
      return;
    }
    if (menuName === "Update Password") {
      navigate("/update-password");
      return;
    }
    if (menuName === "Login") {
      navigate("/login");
      return;
    }
    if (menuName === "Register") {
      navigate("/register");
      return;
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
        {/* <!-- Sidebar Toggle (Topbar) --> */}
        {/* <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
                  <i className="fa fa-bars"></i>
              </button> */}

        {/* <!-- Topbar Search --> */}
        <form className="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
          <div className="input-group">
            <input
              type="text"
              className="form-control bg-light border-0 small"
              placeholder="Search for..."
              aria-label="Search"
              aria-describedby="basic-addon2"
            />
            <div className="input-group-append">
              <button className="btn btn-primary" type="button">
                <i className="fas fa-search fa-sm"></i>
              </button>
            </div>
          </div>
        </form>

        {/* <!-- Topbar Navbar --> */}
        <ul className="navbar-nav ml-auto">
          {/* <!-- Nav Item - Search Dropdown (Visible Only XS) --> */}
          <li className="nav-item dropdown no-arrow d-sm-none">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              id="searchDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <i className="fas fa-search fa-fw"></i>
            </a>
            {/* <!-- Dropdown - Messages --> */}
            <div
              className="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in"
              aria-label="searchDropdown"
            >
              <form className="form-inline mr-auto w-100 navbar-search">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-light border-0 small"
                    placeholder="Search for..."
                    aria-label="Search"
                    aria-describedby="basic-addon2"
                  />
                  <div className="input-group-append">
                    <button className="btn btn-primary" type="button">
                      <i className="fas fa-search fa-sm"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </li>

          {/* <!-- Nav Item - Alerts --> */}
          <NavItemsDropdownAlert
            dropdownTitle="Alerts Center"
            alertMessages={alertMessages}
          />

          <div className="topbar-divider d-none d-sm-block"></div>

          <NavItemsDropdownMenu
            userInfo={userName}
            menuItems={itemsToUse}
            onSelectMenu={handleMenuSelect}
          />
        </ul>
      </nav>
    </div>
  );
}

export default Topbar;
