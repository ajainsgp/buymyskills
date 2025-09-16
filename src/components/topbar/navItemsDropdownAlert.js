import React, { useEffect, useRef, useState } from "react";

function NavItemsDropdownAlert({ dropdownTitle, alertMessages }) {
  const [isToggled, setToggle] = useState(false);
  const alertRef = useRef(null);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setToggle(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setToggle(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const showMessages = () => {
    setToggle(!isToggled);
  };

  const displayMessages = alertMessages.map((msg, index) => (
    <a key={index} href="#" className="dropdown-item d-flex align-items-center">
      <div className="mr-3">
        <div className={`icon-circle ${msg.alertLevel}`}>
          <i className="fas text-white"></i>
        </div>
      </div>
      <div>
        <div className="small text-gray-500">{msg.date}</div>
        <span className="font-weight-bold">{msg.message}</span>
      </div>
    </a>
  ));

  return (
    <li className="nav-item dropdown no-arrow mx-1" ref={alertRef}>
      <a
        className="nav-link dropdown-toggle"
        href="#"
        id="alertsDropdown"
        role="button"
        onClick={showMessages}
        data-toggle="dropdown"
        aria-expanded={isToggled}
      >
        <i className="fas fa-bell fa-fw"></i>
        {/* <!-- Counter - Alerts --> */}
        <span className="badge badge-danger badge-counter">3+</span>
      </a>
      {/* <!-- Dropdown - Alerts --> */}
      <div
        className={`dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in ${isToggled ? "show" : ""}`}
        aria-label="alertsDropdown"
      >
        <h6 className="dropdown-header">{dropdownTitle}</h6>
        {displayMessages}
        <a href="#" className="dropdown-item text-center small text-gray-500">
          Show All Alerts
        </a>
      </div>
    </li>
  );
}

export default NavItemsDropdownAlert;
