import { Link } from "react-router-dom";
import { useMainContext } from "../context/MainContext";
import { useAuthContext } from "../context/AuthContext";

const Footer: React.FC = () => {
  const { contactGithub, siteDescription } = useMainContext();
  const { user, logout } = useAuthContext();

  return (
    <footer className="mt-5 pt-4 pb-4 bg-light border-top">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="mb-3">
              <i className="bi bi-journal-richtext me-2"></i>
              MDBlog
            </h5>
            <p className="text-muted">{siteDescription}</p>
          </div>
          <div className="col-md-3 mb-4 mb-md-0">
            <h5>바로가기</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-decoration-none">
                  <i className="bi bi-house-door me-1"></i>홈
                </Link>
              </li>
              <li>
                <Link to="/posts" className="text-decoration-none">
                  <i className="bi bi-file-text me-1"></i>
                  최신 게시물
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-2 mb-4 mb-md-0">
            <h5>계정</h5>
            <ul className="list-unstyled">
              {user ? (
                <div>
                  <li className="mb-2">
                    <Link className="text-decoration-none" to="">
                      <i className="bi bi-person me-1"></i>내 프로필
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link className="text-decoration-none" to="/auth/login">
                      <i className="bi bi-file-earmark-text me-1"></i>내 게시물
                    </Link>
                  </li>
                  <li>
                    <Link className="text-decoration-none" onClick={logout} to="">
                      <i className="bi bi-box-arrow-right me-1"></i>로그아웃
                    </Link>
                  </li>
                </div>
              ) : (
                <div>
                  <li>
                    <Link to="/auth/login" className="text-decoration-none">
                      <i className="bi bi-box-arrow-in-right me-1"></i>
                      로그인
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth/register" className="text-decoration-none">
                      <i className="bi bi-person-plus me-1"></i>
                      회원가입
                    </Link>
                  </li>
                </div>
              )}
            </ul>
          </div>

          <div className="col-md-3">
            <h5 className="mb-3">소셜 미디어</h5>
            <div className="d-flex justify-content-center gap-3">
              <Link
                className="text-decoration-none fs-4 text-dark"
                to={contactGithub}
                target="_blank"
                title="github"
              >
                <i className="bi bi-github"></i>
              </Link>
            </div>
          </div>
          <hr className="my-4" />
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="text-muted mb-3 mb-md-0">
              {new Date().getFullYear()} MDBlog. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
