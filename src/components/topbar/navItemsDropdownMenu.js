import React, { useEffect, useRef, useState } from "react";
import API_BASE from "../../utils/apiBase";

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

  const DEFAULT_AVATAR = "http://ssl.gstatic.com/accounts/ui/avatar_2x.png";
  const [photoUrl, setPhotoUrl] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    let ignore = false;

    function getCurrentUser() {
      const s = sessionStorage.getItem("currentUser");
      if (s) {
        try {
          return JSON.parse(s);
        } catch (_e) {
          /* ignore */
        }
      }
      if (localStorage.getItem("rememberMe") === "true") {
        const l = localStorage.getItem("currentUser");
        if (l) {
          try {
            return JSON.parse(l);
          } catch (_e) {
            /* ignore */
          }
        }
      }
      return null;
    }

    async function loadPhoto() {
      try {
        const cu = getCurrentUser();
        if (!cu || !cu.id) {
          if (!ignore) setPhotoUrl(DEFAULT_AVATAR);
          return;
        }
        const res = await fetch(`${API_BASE}/api/users/${cu.id}/photo`);
        if (!res.ok) {
          if (!ignore) setPhotoUrl(DEFAULT_AVATAR);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!ignore && data && data.contentType && data.base64) {
          setPhotoUrl(`data:${data.contentType};base64,${data.base64}`);
        } else if (!ignore) {
          setPhotoUrl(DEFAULT_AVATAR);
        }
      } catch {
        if (!ignore) setPhotoUrl(DEFAULT_AVATAR);
      }
    }

    loadPhoto();

    function onAuthChanged() {
      loadPhoto();
    }
    function onStorage(e) {
      if (!e || e.key === "currentUser" || e.key === "rememberMe") {
        loadPhoto();
      }
    }

    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);

    return () => {
      ignore = true;
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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
        className={`fas ${item.menuItemIcon} fa-sm fa-fw mr-2 text-blue-400`}
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
        <span className="mr-2 d-none d-lg-inline text-blue-600 small">
          {userInfo}
        </span>
        <img
          className="img-profile rounded-circle"
          src={photoUrl}
          alt={userInfo}
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
