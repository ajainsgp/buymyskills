import React, { useEffect, useRef, useState } from "react";

function NavItemsDropdownMenu({ userInfo, menuItems, onSelectMenu }) {
  const [isToggled, setToggle] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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

  const showMenuItems = () => {
    setToggle(!isToggled);
  };

  const displayMenu = menuItems.map((item, index) => (
    <a
      key={index}
      href="#"
      className="dropdown-item"
      onClick={(e) => {
        e.preventDefault();
        if (onSelectMenu) {
          onSelectMenu(item.menuItemName, item);
        }
        setToggle(false);
      }}
    >
      <i
        className={`fas ${item.menuItemIcon} fa-sm fa-fw mr-2 text-gray-400`}
      ></i>
      {item.menuItemName}
      {item.showDivider && <div className="dropdown-divider"></div>}
    </a>
  ));

  return (
    <li className="nav-item dropdown no-arrow" ref={menuRef}>
      <a
        className="nav-link dropdown-toggle"
        href="#"
        id="menuDropdown"
        role="button"
        onClick={showMenuItems}
        data-toggle="dropdown"
        aria-expanded={isToggled}
      >
        <span className="mr-2 d-none d-lg-inline text-gray-600 small">
          {userInfo}
        </span>
        <img
          className="img-profile rounded-circle"
          src="img/undraw_profile.svg"
          alt="userInfo"
        />
      </a>
      {/* <!-- Dropdown - Menu Items --> */}
      <div
        className={`dropdown-menu dropdown-menu-right shadow animated--grow-in ${isToggled ? "show" : ""}`}
        aria-label="menuDropdown"
      >
        {displayMenu}
      </div>
    </li>
  );
}

export default NavItemsDropdownMenu;
