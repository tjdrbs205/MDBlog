import { Link } from "react-router-dom";
import { useMainContext } from "../context/MainContext";

const Footer: React.FC = () => {
  const { contactGithub, siteDescription } = useMainContext();
  const currentUser = null;
  return (
    <footer>
      <div className="container">
        <div className="row">
          <div>
            <h5>MDBlog</h5>
            <p className="text-muted">{siteDescription}</p>
          </div>
          <div>
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
          <div>
            <h5>계정</h5>
            <ul className="list-unstyled">
              {currentUser ? (
                "b"
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
          <div>
            <h5>소셜 미디어</h5>
            <div className="d-flex justify-content-center gap-3">
              <ul>
                <li>
                  <Link to={contactGithub}>깃허브</Link>
                </li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div>
            <a>{new Date().getFullYear()} MDBlog. All rights reserved.</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
