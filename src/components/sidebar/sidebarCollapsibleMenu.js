import React, { useEffect, useState } from "react";
import menuData from "../../data/sidebarMenu.json";

function SidebarCollapsibleMenu() {
  const sideMenuData = menuData.sideMenuDetails;

  // Initialize collapsed state once from data (no mutation during render)
  const [collapsedMap, setCollapsedMap] = useState(() => {
    const init = {};
    sideMenuData.forEach((section) => {
      section.sidebarMenu.forEach((menu) => {
        init[menu.menuTitle] = true;
      });
    });
    return init;
  });

  const [isAdmin, setIsAdmin] = useState(false);

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
        const role = cu ? String(cu.roleType || "").toLowerCase() : "";
        const emailLower = cu ? String(cu.emailId || "").toLowerCase() : "";
        setIsAdmin(
          role.includes("admin") || emailLower === "admin@buymyskills.local",
        );
      } catch {
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

  return sideMenuData.map((item) => (
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
                {(isAdmin
                  ? sidebarMenu.menuItems
                  : sidebarMenu.menuItems.filter(
                      (menuItem) => menuItem.name !== "Categories",
                    )
                ).map((menuItem) => (
                  <a
                    className="collapse-item"
                    key={`${sidebarMenu.menuTitle}-${menuItem.name}`}
                    href={menuItem.link}
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
