import React, { useState } from "react";
import "./sidebar.css";
import SidebarCollapsibleMenu from "./sidebarCollapsibleMenu";
import SidebarFilters from "./SidebarFilters";

function Sidebar() {
  const [isToggled, setToggled] = useState(false);
  const onToggle = () => {
    setToggled(!isToggled);
  };

  return (
    <ul
      key="sideBar"
      id="accordionSidebar"
      className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${isToggled ? "toggled" : ""}`}
    >
      {/* <!-- Sidebar - Brand --> */}
      <a
        href="/home"
        className="sidebar-brand d-flex align-items-center justify-content-center"
      >
        <div className="sidebar-brand-icon rotate-n-15">
          <i className="fas fa-laugh-wink"></i>
        </div>
        <div className="sidebar-brand-text mx-3">Buy My Skills</div>
      </a>
      {/* <!-- Divider --> */}
      <hr className="sidebar-divider my-0" />

      {/* <!-- Nav Item - Dashboard --> */}
      <li key="dashboard" className="nav-item active">
        <a className="nav-link" href="/home">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </a>
      </li>
      {/* <li key="dashboard2" className="nav-item">
        <a className="nav-link" href="dashboard2">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard2</span>
        </a>
      </li> */}
      {/* <!-- Divider --> */}
      <hr className="sidebar-divider" />

      <SidebarFilters />

      <hr className="sidebar-divider" />

      <SidebarCollapsibleMenu />

      {/* <!-- Sidebar Toggler Button --> */}
      <div className="text-center d-none d-md-inline">
        <button
          className="rounded-circle border-0"
          id="sidebarToggle"
          onClick={onToggle}
        ></button>
      </div>
    </ul>
  );
}

export default Sidebar;
