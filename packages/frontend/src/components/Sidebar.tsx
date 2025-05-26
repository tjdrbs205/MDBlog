import { Link, useSearchParams } from "react-router-dom";
import { useMainContext } from "../context/MainContext";
import "../styles/Sidebar.css";
import { ICategoryWithChildren } from "@mdblog/shared/src/types/categories.interface";

const Sidebar = () => {
  const [searchParams] = useSearchParams();

  const { profileImage, categoriesHierarchical, categoryMap } = useMainContext();

  const currentUser = null;

  const selectedCategory = searchParams.get("category") || null;

  // const renderCategoryTree = (categories: ICategoryWithChildren, level = 0) => { categories.forEach(cat => { const postCount = categoryMap[cat._id] || 0;

  let totalPostCount = 0;
  Object.values(categoryMap || {}).forEach((count) => {
    totalPostCount += count;
  });

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body text-center">
          <img
            src={profileImage}
            alt="Profile"
            className="rounded-circle mb-3"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
          />
          <h5 className="card-title">블로그 소개</h5>
          <p className="card-text text-muted">개발 관련 정보와 팁을 공유하는 블로그입니다.</p>
          {currentUser ? (
            <p className="card-text">
              <strong>{currentUser}</strong>남 환영합니다!
            </p>
          ) : (
            <Link to="" className="btn btn-primary btn-me">
              로그인
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-folder me-2"></i>
            카테고리
          </h5>
        </div>
        <div className="card-body p-2">
          <ul className="category-tree">
            {categoriesHierarchical && categoriesHierarchical.length > 0 ? "" : ""}
            <li className="category-item level-0">
              <div className="category-header">
                <span className="toggle-placeholder"></span>
                <Link to="/posts" className={`category-link ${!selectedCategory ? "active" : ""}`}>
                  <i className="bi bi-journals category-icon"></i> 전체 글
                  <span className="count">{totalPostCount}</span>
                </Link>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
