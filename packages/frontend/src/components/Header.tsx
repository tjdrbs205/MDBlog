import React from "react";
import { Link } from "react-router-dom";
import { useMainContext } from "../context/MainContext";
import SearchComponent from "./SearchComponent";
import UserProfile from "./UserProfile";

const Header: React.FC = () => {
  const appTitle = import.meta.env.VITE_APP_TITLE || "MDBlog";
  const { categories } = useMainContext();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-journal-richtext me-2"></i>
          {appTitle}
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li>
              <Link className="nav-link" to="/">
                <i className="bi bi-house-door me-1"></i>홈
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/posts/popular">
                <i className="bi bi-star me-1"></i>
                인기 게시물
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/posts">
                <i className="bi bi-clock-history me-1"></i>
                최신 글
              </Link>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="topicsDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-collection me-1"></i>토픽별
              </a>
              <ul className="dropdown-menu" aria-labelledby="topicsDropdown">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link className="dropdown-item" to={`/posts?category=${cat.id}`}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/posts/archive">
                <i className="bi bi-archive me-1"></i>아카이브
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/about">
                <i className="bi bi-info-circle me-1"></i>소개
              </Link>
            </li>
          </ul>
          <SearchComponent placeholder="검색" className="top" />
          <UserProfile />
        </div>
      </div>
    </nav>
  );
};

export default Header;
