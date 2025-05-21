import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const appTitle = import.meta.env.VITE_APP_TITLE || "MDBlog";

  return (
    <header className="Header">
      <div className="Header-brand">
        <Link to="/">{appTitle}</Link>
      </div>
      <div className="Header-menu">
        <ul>
          <li>
            <Link to="/">홈</Link>
          </li>
          <li>
            <Link to="/posts">게시물</Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
