import React, { useEffect, useState } from "react";
import menuData from "../../data/sidebarMenu.json";

function SidebarCollapsibleMenu() {
  const sideMenuData = menuData.sideMenuDetails;

  // Initialize collapsed state once from data (no mutation during render)
  // Only include menus that should be displayed
  const [collapsedMap, setCollapsedMap] = useState(() => {
    const init = {};
    sideMenuData.forEach((section) => {
      if (section.display === "show") {
        section.sidebarMenu.forEach((menu) => {
          if (menu.display === "show") {
            init[menu.menuTitle] = true;
          }
        });
      }
    });
    return init;
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
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
    function sync() {
      try {
        const cu = getCurrentUser();
        setIsAuthed(!!cu);
        const role = cu ? String(cu.roleType || "").toLowerCase() : "";
        const emailLower = cu ? String(cu.emailId || "").toLowerCase() : "";
        setIsAdmin(
          role.includes("admin") || emailLower === "admin@buymyskills.local",
        );
      } catch {
        setIsAuthed(false);
        setIsAdmin(false);
      }
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const toggleCollapse = (menuId) => {
    setCollapsedMap((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleMenuItemClick = (menuItem, e) => {
    if (menuItem.name === "Logout") {
      e.preventDefault();
      try {
        sessionStorage.removeItem("currentUser");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("rememberMe");
      } catch (error) {
        // ignore
      }
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new Event("auth-changed"));
      }
      // Navigate to login, but since it's sidebar, perhaps use window.location
      window.location.href = "/login";
      return;
    }
    // For others, let the href handle it
  };

  const getFilteredMenuItems = (sidebarMenu) => {
    if (sidebarMenu.menuTitle === "Menu") {
      return sidebarMenu.menuItems.filter((item) => {
        if (item.name === "Login") return !isAuthed;
        if (item.name === "Logout") return isAuthed;
        if (item.name === "Register") return !isAuthed;
        if (item.name === "Categories") return isAdmin;
        if (item.name === "Read Me") return isAdmin;
        return true;
      });
    } else {
      // For other menus, same logic
      return isAdmin
        ? sidebarMenu.menuItems
        : sidebarMenu.menuItems.filter(
            (menuItem) => menuItem.name !== "Categories",
          );
    }
  };

  // Filter sections and menus based on display attribute
  const visibleSections = sideMenuData.filter(
    (item) => item.display === "show",
  );
  const visibleMenus = visibleSections.reduce((acc, item) => {
    const visibleMenuItems = item.sidebarMenu.filter(
      (menu) => menu.display === "show",
    );
    if (visibleMenuItems.length > 0) {
      acc.push({ ...item, sidebarMenu: visibleMenuItems });
    }
    return acc;
  }, []);

  return visibleMenus.map((item) => (
    <React.Fragment key={item.sidebarHeading}>
      <div className="sidebar-heading">{item.sidebarHeading}</div>
      {item.sidebarMenu.map((sidebarMenu) => {
        const collapsed = collapsedMap[sidebarMenu.menuTitle];
        const panelId = `collapse-${sidebarMenu.menuTitle}`;
        return (
          <li key={sidebarMenu.menuTitle} className="nav-item">
            <a
              className={`nav-link ${collapsed ? "collapsed" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggleCollapse(sidebarMenu.menuTitle);
              }}
              data-toggle="collapse"
              aria-expanded={collapsed ? "false" : "true"}
              aria-controls={panelId}
            >
              <i className={sidebarMenu.menuTitleIcon}></i>
              <span>{sidebarMenu.menuTitle}</span>
            </a>
            <div
              id={panelId}
              className={`collapse ${collapsed ? "" : "show"}`}
              aria-label={sidebarMenu.menuTitle}
            >
              <div className="bg-white py-2 collapse-inner rounded">
                <h6 className="collapse-header">
                  {sidebarMenu.collapseHeader}
                </h6>
                {getFilteredMenuItems(sidebarMenu).map((menuItem) => (
                  <a
                    className="collapse-item"
                    key={`${sidebarMenu.menuTitle}-${menuItem.name}`}
                    href={menuItem.link}
                    onClick={(e) => handleMenuItemClick(menuItem, e)}
                  >
                    {menuItem.name}
                  </a>
                ))}
              </div>
            </div>
          </li>
        );
      })}
      {item.addSideBarDivider && <hr className="sidebar-divider" />}
    </React.Fragment>
  ));
}

export default SidebarCollapsibleMenu;
