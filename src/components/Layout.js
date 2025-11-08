import React from "react";
import Topbar from "./topbar/topbar";
import Footer from "./Footer";

function Layout({ children, showFooter = true }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Topbar />
      <div className="flex-grow-1">{children}</div>
      {showFooter && <Footer />}
    </div>
  );
}

export default Layout;
