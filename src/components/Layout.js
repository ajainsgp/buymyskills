import React from "react";
import Topbar from "./topbar/topbar";
import Footer from "./Footer";

function Layout({ children, showFooter = true }) {
  return (
    <>
      <Topbar />
      {children}
      {showFooter && <Footer />}
    </>
  );
}

export default Layout;
