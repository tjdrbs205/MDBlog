import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { IReadOnlyUser } from "@mdblog/shared/src/types/user.interface";

const UserProfile = () => {
  const [user, setUser] = useState<IReadOnlyUser | null>(null);
  const { isAuthenticated, userData, logout, profile } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && !userData) {
      profile().then((data) => {
        if (typeof data === "string") {
          setUser(null);
        } else {
          setUser(data);
        }
      });
    } else {
      setUser(userData);
    }
  }, [isAuthenticated]);

  return (
    <ul className="navbar-nav">
      {isAuthenticated ? (
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            to="#"
            id="navbarDropdown"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img
              src={user?.profileImage || ""}
              alt="Profile"
              className="rounded-circle me-2"
              style={{ width: "30px", height: "30px", objectFit: "cover" }}
            />
            {user?.username}
          </Link>
          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
            <li>
              <Link className="dropdown-item" to="/posts/new">
                <i className="bi bi-pencil-square me-2"></i>새 글 작성
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/my/profile">
                <i className="bi bi-person me-2"></i> 내 프로필
              </Link>
            </li>
            {user?.role === "admin" && (
              <>
                <li>
                  <hr className="dropdown-divider"></hr>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin">
                    <i className="bi bi-speedometer2 me-2"></i> 관리자 대시보드
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/admin/contents">
                    <i className="bi bi-grid-3x3 me-2"></i> 콘텐츠 관리
                  </Link>
                </li>
              </>
            )}
            <li>
              <hr className="dropdown-divider"></hr>
            </li>
            <li>
              <Link className="dropdown-item" to="/" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>로그아웃
              </Link>
            </li>
          </ul>
        </li>
      ) : (
        <>
          <li className="nav-item">
            <Link className="nav-link" to="/auth/login">
              <i className="bi bi-box-arrow-in-right me-1"></i>
              로그인
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/auth/register">
              <i className="bi bi-person-plus me-1"></i>
              회원가입
            </Link>
          </li>
        </>
      )}
    </ul>
  );
};

export default UserProfile;
