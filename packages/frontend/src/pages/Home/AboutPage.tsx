import { useMainContext } from "../../context/MainContext";
import parse from "html-react-parser";

const AboutPage: React.FC = () => {
  const { profileImage, aboutBlogHtml, contactGithub, contactEmail } = useMainContext();
  return (
    <div className="about-container">
      <div className="card mb-4">
        <div className="card-header">
          <div className="text-center mb-4">
            <img
              src={profileImage}
              alt="프로필 이미지"
              className="rounded-circle mb-3"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
            <h1 className="display-5 fw-bold">MDBlog</h1>
            <p className="lead text-muted">개인 개발 블로그</p>
          </div>

          <div className="row">
            <div className="col-md-8 mx-auto">
              <div className="mb-4">
                <div className="markdown-content">{parse(aboutBlogHtml)}</div>
              </div>

              <div className="mb-4">
                <h2 className="h3 border-bottom pb-2 mb-3">주요 기능</h2>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="bi bi-markdown fs-1 text-primary"></i>
                      </div>
                      <div>
                        <h3 className="h5">마크다운 지원</h3>
                        <p className="text-muted">깔끔한 문서 작성과 코드 하이라이팅</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="bi bi-tags fs-1 text-primary"></i>
                      </div>
                      <div>
                        <h3 className="h5">카테고리와 태그</h3>
                        <p className="text-muted">체계적인 콘텐츠 관리와 검색</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="bi bi-search fs-1 text-primary"></i>
                      </div>
                      <div>
                        <h3 className="h5">검색 기능</h3>
                        <p className="text-muted">빠른 콘텐츠 검색과 필터링</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="bi bi-person-circle fs-1 text-primary"></i>
                      </div>
                      <div>
                        <h3 className="h5">사용자 관리</h3>
                        <p className="text-muted">멀티 유저 지원과 권한 관리</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h2 className="h3 border-bottom pb-2 mb-3">연락처</h2>
                <ul className="list-unstyled">
                  {contactEmail && (
                    <li className="mb2">
                      <i className="bi bi-envelope me-2" />
                      <a href={`mailto:${contactEmail}`} className="text-decoration-none">
                        {contactEmail}
                      </a>
                    </li>
                  )}
                  {contactGithub && (
                    <li className="mb-2">
                      <i className="bi bi-github me-2" />
                      <a
                        href={`${
                          contactGithub.includes("http")
                            ? contactGithub
                            : `https://github.com/${contactGithub}`
                        }`}
                        target="_blank"
                      >
                        {contactGithub.includes("http")
                          ? contactGithub
                          : `https://github.com/${contactGithub}`}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
